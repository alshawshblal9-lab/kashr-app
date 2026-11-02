import React, { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase } from './data/initialData';
import { AppDatabase, User } from './types';
import { Header } from './components/Header';
import { BottomNav, MainTabType } from './components/BottomNav';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginModal } from './components/LoginModal';
import { HomeScreen } from './components/HomeScreen';
import { SalesModule } from './components/modules/SalesModule';
import { StockModule } from './components/modules/StockModule';
import { AccountsModule } from './components/modules/AccountsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { Smartphone, Monitor, ArrowRight, Home } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(loadDatabase);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Default to admin for immediate interactive preview
    return db.users.find((u) => u.username === 'admin') || db.users[0] || null;
  });

  // Default to 'home' so the 4 main module icons appear immediately on launch as requested!
  const [activeTab, setActiveTab] = useState<MainTabType>('home');

  // Default subViews to 'menu' so clicking any of the 4 icons shows its internal sub-icons!
  const [salesSubView, setSalesSubView] = useState<'menu' | 'invoice' | 'return' | 'reports' | 'statement'>('menu');
  const [stockSubView, setStockSubView] = useState<'menu' | 'items' | 'in' | 'out' | 'transfer' | 'receive' | 'reports'>('menu');
  const [accountsSubView, setAccountsSubView] = useState<'menu' | 'tree' | 'receipt' | 'payment' | 'transfers' | 'statements'>('menu');
  const [settingsSubView, setSettingsSubView] = useState<'menu' | 'users' | 'areas' | 'warehouses' | 'funds' | 'limits' | 'backup'>('menu');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [receiptState, setReceiptState] = useState<{
    isOpen: boolean;
    title: string;
    docNo: string;
    html: string;
    rawText?: string;
  }>({
    isOpen: false,
    title: '',
    docNo: '',
    html: '',
  });

  // Mobile frame simulator on desktop
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Sync DB to localStorage
  const handleUpdateDb = (updated: AppDatabase) => {
    setDb(updated);
    saveDatabase(updated);
  };

  // Pending items counts for active user
  const pendingStockCount = db.transfers.filter((t) => {
    if (t.status !== 'pending') return false;
    if (!currentUser || currentUser.warehouse === 'all') return true;
    return t.toWh === currentUser.warehouse;
  }).length;

  const pendingFundCount = db.fundTransfers.filter((f) => {
    if (f.status !== 'pending') return false;
    if (!currentUser || currentUser.fund === 'all' || currentUser.role === 'admin') return true;
    return f.toFund === currentUser.fund;
  }).length;

  // Handle open receipt
  const handleShowReceipt = (title: string, docNo: string, html: string, rawText?: string) => {
    setReceiptState({
      isOpen: true,
      title,
      docNo,
      html,
      rawText,
    });
  };

  // Quick switch user
  const handleQuickSwitchUser = () => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    const otherUser =
      currentUser.username === 'admin'
        ? db.users.find((u) => u.username === 'rep1')
        : db.users.find((u) => u.username === 'admin');

    if (otherUser) {
      setCurrentUser(otherUser);
    } else {
      setIsLoginOpen(true);
    }
  };

  // Navigation from Home or shortcuts
  const handleNavigateFromHome = (tab: MainTabType, sub?: string) => {
    setActiveTab(tab);
    if (tab === 'sales') {
      setSalesSubView((sub as any) || 'menu');
    } else if (tab === 'stock') {
      setStockSubView((sub as any) || 'menu');
    } else if (tab === 'accounts') {
      setAccountsSubView((sub as any) || 'menu');
    } else if (tab === 'settings') {
      setSettingsSubView((sub as any) || 'menu');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adjust active tab if permissions change
  useEffect(() => {
    if (currentUser && activeTab !== 'home') {
      const perms = currentUser.permissions || [];
      if (!perms.includes(activeTab)) {
        setActiveTab('home');
      }
    }
  }, [currentUser, activeTab]);

  const getModuleTitle = () => {
    switch (activeTab) {
      case 'sales':
        return 'إدارة المبيعات والمرتجعات';
      case 'stock':
        return 'إدارة المخازن وحركات المواد';
      case 'accounts':
        return 'دليل الحسابات والحركات المالية';
      case 'settings':
        return 'الإعدادات والصلاحيات';
      default:
        return 'القائمة الرئيسية';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-blue-600 selection:text-white">
      {/* Desktop Responsive Toolbar (Visible only on wider screens) */}
      <div className="w-full bg-slate-950 text-slate-300 py-1.5 px-4 text-xs hidden md:flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300">واجهة الجوال بالأيقونات الأربع:</span>
          <span className="text-slate-400">
            تفتح الشاشة الرئيسية فوراً بالأيقونات الأربع مع إمكانية التنقل السريع لكافة الأقسام
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileFrame(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isMobileFrame ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>عرض هاتف (Mobile View)</span>
          </button>
          <button
            onClick={() => setIsMobileFrame(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              !isMobileFrame ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>عرض واسع (Full View)</span>
          </button>
        </div>
      </div>

      {/* Main Mobile App Frame */}
      <div
        className={`w-full min-h-screen bg-slate-100 flex flex-col relative transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-[440px] md:my-5 md:rounded-[36px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] md:border-[6px] md:border-slate-800 md:min-h-[850px] overflow-hidden'
            : 'max-w-2xl'
        }`}
      >
        {/* Offline & PWA Install Banner */}
        <PWAInstallBanner />

        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onLogout={() => setIsLoginOpen(true)}
          pendingStockCount={pendingStockCount}
          pendingFundCount={pendingFundCount}
          onOpenNotifications={() => {
            if (pendingStockCount > 0) {
              setActiveTab('stock');
              setStockSubView('receive');
            } else if (pendingFundCount > 0) {
              setActiveTab('accounts');
              setAccountsSubView('transfers');
            }
          }}
          onQuickSwitchUser={handleQuickSwitchUser}
          onGoHome={() => setActiveTab('home')}
          isHome={activeTab === 'home'}
        />

        {/* Back to Home Navigation Pill when inside any Sub-Module */}
        {activeTab !== 'home' && (
          <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shadow-xs sticky top-[48px] z-20">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 px-2.5 py-1 rounded-xl transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرئيسية (القوائم الأربع)</span>
            </button>
            <span className="text-xs font-bold text-slate-700 truncate max-w-[190px]">
              {getModuleTitle()}
            </span>
          </div>
        )}


        {/* Dynamic Content Module based on Active Tab */}
        <main className="flex-1 pb-20 overflow-x-hidden">
          {currentUser && (
            <>
              {/* 1. HOME SCREEN: The 4 Core Menus as Big Mobile Icon Tiles */}
              {activeTab === 'home' && (
                <HomeScreen
                  currentUser={currentUser}
                  db={db}
                  onNavigateTab={handleNavigateFromHome}
                  pendingStockCount={pendingStockCount}
                  pendingFundCount={pendingFundCount}
                />
              )}

              {/* 2. SALES MODULE */}
              {activeTab === 'sales' && (
                <SalesModule
                  key={`sales-${salesSubView}`}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={handleUpdateDb}
                  onShowReceipt={handleShowReceipt}
                  initialSubView={salesSubView}
                />
              )}

              {/* 3. STOCK MODULE */}
              {activeTab === 'stock' && (
                <StockModule
                  key={`stock-${stockSubView}`}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={handleUpdateDb}
                  onShowReceipt={handleShowReceipt}
                  initialSubView={stockSubView}
                />
              )}

              {/* 4. ACCOUNTS MODULE */}
              {activeTab === 'accounts' && (
                <AccountsModule
                  key={`accounts-${accountsSubView}`}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={handleUpdateDb}
                  onShowReceipt={handleShowReceipt}
                  initialSubView={accountsSubView}
                />
              )}

              {/* 5. SETTINGS MODULE */}
              {activeTab === 'settings' && (
                <SettingsModule
                  key={`settings-${settingsSubView}`}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={handleUpdateDb}
                  initialSubView={settingsSubView}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Thumb Navigation Bar with Home Tab */}
        {currentUser && (
          <BottomNav
            activeTab={activeTab}
            onChangeTab={(t) => {
              setActiveTab(t);
              // When tapping a bottom nav tab, reset its subView to 'menu' so icons appear!
              if (t === 'sales') setSalesSubView('menu');
              else if (t === 'stock') setStockSubView('menu');
              else if (t === 'accounts') setAccountsSubView('menu');
              else if (t === 'settings') setSettingsSubView('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            permissions={currentUser.permissions || []}
            pendingStockCount={pendingStockCount}
            pendingFundCount={pendingFundCount}
          />
        )}
      </div>

      {/* Login Screen Modal */}
      <LoginModal
        isOpen={isLoginOpen || !currentUser}
        users={db.users}
        onLogin={(u) => {
          setCurrentUser(u);
          setIsLoginOpen(false);
          setActiveTab('home');
        }}
      />

      {/* Receipt & Thermal Slip Modal */}
      <ReceiptModal
        isOpen={receiptState.isOpen}
        onClose={() => setReceiptState({ ...receiptState, isOpen: false })}
        title={receiptState.title}
        docNo={receiptState.docNo}
        contentHtml={receiptState.html}
        rawSummaryText={receiptState.rawText}
      />
    </div>
  );
}
