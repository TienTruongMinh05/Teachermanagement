/* =========================================================
   JAVASCRIPT: TRƯỜNG THPT NGUYỄN HUỆ - GIÁM SÁT THỜI KHÓA BIỂU
   3 chế độ xem: Dạng Thẻ, Dạng Lưới, Dạng Bảng
   Lọc theo 4 ô thống kê, tắt máy chủ an toàn
   ========================================================= */

// --- Helper Functions ---
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Global State ---
const state = {
    activeTab: 'teacher', // 'teacher' | 'class'
    mode: 'realtime',     // 'realtime' | 'custom'
    targetDay: 2,
    targetSession: 'sang',
    targetPeriod: 1,
    activeView: 'card',   // 'card' | 'grid' | 'table'
    statusInfo: null,
    
    // Teacher State
    search: '',
    subject: 'all',
    class_name: 'all',
    status: 'all',
    teachers: [],
    matrix: null,
    lastCellDetail: null,
    
    // Class State
    classSearch: '',
    classGrade: 'all',
    classSubject: 'all',
    classHomeroom: 'all',
    classStatus: 'all',
    classes: [],
    classMatrix: null,
    lastClassCellDetail: null,

    bellSchedule: [],
    authConfig: null,
    currentUser: null,
    appInitialized: false
};

// --- DOM Elements ---
const el = {
    // Auth & Login Gate
    loginGateOverlay: document.getElementById('loginGateOverlay'),
    googleSignInBtnContainer: document.getElementById('googleSignInBtnContainer'),
    demoLoginWrapper: document.getElementById('demoLoginWrapper'),
    btnDemoLogin: document.getElementById('btnDemoLogin'),
    loginErrorAlert: document.getElementById('loginErrorAlert'),
    userProfileBadge: document.getElementById('userProfileBadge'),
    userAvatarImg: document.getElementById('userAvatarImg'),
    userAvatarInitial: document.getElementById('userAvatarInitial'),
    userDisplayName: document.getElementById('userDisplayName'),
    userDisplayEmail: document.getElementById('userDisplayEmail'),
    btnLogout: document.getElementById('btnLogout'),
    btnMenuLogout: document.getElementById('btnMenuLogout'),

    liveClock: document.getElementById('liveClock'),
    liveDate: document.getElementById('liveDate'),
    livePeriodBadge: document.getElementById('livePeriodBadge'),
    schoolName: document.getElementById('schoolName'),
    metaYear: document.getElementById('metaYear'),
    metaSemester: document.getElementById('metaSemester'),

    // Top Navigation Tabs & Settings Menu
    btnNavTeacher: document.getElementById('btnNavTeacher'),
    btnNavClass: document.getElementById('btnNavClass'),
    btnSettingsToggle: document.getElementById('btnSettingsToggle'),
    settingsDropdownMenu: document.getElementById('settingsDropdownMenu'),
    settingsDropdownWrapper: document.getElementById('settingsDropdownWrapper'),

    // Tab Sections
    sectionTeacherManagement: document.getElementById('sectionTeacherManagement'),
    sectionClassManagement: document.getElementById('sectionClassManagement'),

    // Mode & Controls
    modeRealtime: document.getElementById('modeRealtime'),
    modeCustom: document.getElementById('modeCustom'),
    customTimePickers: document.getElementById('customTimePickers'),
    selectDay: document.getElementById('selectDay'),
    selectSession: document.getElementById('selectSession'),
    selectPeriod: document.getElementById('selectPeriod'),
    btnApplyCustomTime: document.getElementById('btnApplyCustomTime'),

    // View buttons
    btnViewCard: document.getElementById('btnViewCard'),
    btnViewGrid: document.getElementById('btnViewGrid'),
    btnViewTable: document.getElementById('btnViewTable'),
    sectionCardView: document.getElementById('sectionCardView'),
    sectionGridView: document.getElementById('sectionGridView'),
    sectionTableView: document.getElementById('sectionTableView'),
    filterToolbar: document.getElementById('filterToolbar'),
    legendBar: document.getElementById('legendBar'),

    // Teacher Stats
    statTotal: document.getElementById('statTotal'),
    statTeaching: document.getElementById('statTeaching'),
    statFree: document.getElementById('statFree'),
    statSpecial: document.getElementById('statSpecial'),
    filterCardTotal: document.getElementById('filterCardTotal'),
    filterCardTeaching: document.getElementById('filterCardTeaching'),
    filterCardFree: document.getElementById('filterCardFree'),
    filterCardSpecial: document.getElementById('filterCardSpecial'),

    // Teacher Filters
    searchInput: document.getElementById('searchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    filterSubject: document.getElementById('filterSubject'),
    filterClass: document.getElementById('filterClass'),
    filterStatus: document.getElementById('filterStatus'),
    targetTimeLabel: document.getElementById('targetTimeLabel'),
    teachersCardGrid: document.getElementById('teachersCardGrid'),
    teachersCompactGrid: document.getElementById('teachersCompactGrid'),
    emptyStateCards: document.getElementById('emptyStateCards'),
    emptyStateGrid: document.getElementById('emptyStateGrid'),
    btnResetFiltersCards: document.getElementById('btnResetFiltersCards'),
    btnResetFiltersGrid: document.getElementById('btnResetFiltersGrid'),

    // Teacher Table view
    matrixTableBody: document.getElementById('matrixTableBody'),
    btnRefreshTable: document.getElementById('btnRefreshTable'),

    // Class Stats
    statClassTotal: document.getElementById('statClassTotal'),
    statClassLearning: document.getElementById('statClassLearning'),
    statClassFree: document.getElementById('statClassFree'),
    statClassSpecial: document.getElementById('statClassSpecial'),
    filterCardClassTotal: document.getElementById('filterCardClassTotal'),
    filterCardClassLearning: document.getElementById('filterCardClassLearning'),
    filterCardClassFree: document.getElementById('filterCardClassFree'),
    filterCardClassSpecial: document.getElementById('filterCardClassSpecial'),

    // Class Filters & Views
    filterToolbarClass: document.getElementById('filterToolbarClass'),
    legendBarClass: document.getElementById('legendBarClass'),
    searchClassInput: document.getElementById('searchClassInput'),
    btnClearSearchClass: document.getElementById('btnClearSearchClass'),
    filterClassGrade: document.getElementById('filterClassGrade'),
    filterClassSubject: document.getElementById('filterClassSubject'),
    filterClassHomeroom: document.getElementById('filterClassHomeroom'),
    filterClassStatus: document.getElementById('filterClassStatus'),
    targetTimeLabelClass: document.getElementById('targetTimeLabelClass'),
    sectionClassCardView: document.getElementById('sectionClassCardView'),
    classesCardGrid: document.getElementById('classesCardGrid'),
    emptyStateClassCards: document.getElementById('emptyStateClassCards'),
    btnResetFiltersClassCards: document.getElementById('btnResetFiltersClassCards'),
    sectionClassGridView: document.getElementById('sectionClassGridView'),
    classesCompactGrid: document.getElementById('classesCompactGrid'),
    emptyStateClassGrid: document.getElementById('emptyStateClassGrid'),
    btnResetFiltersClassGrid: document.getElementById('btnResetFiltersClassGrid'),
    sectionClassTableView: document.getElementById('sectionClassTableView'),
    selectClassForSchedule: document.getElementById('selectClassForSchedule'),
    btnRefreshClassTable: document.getElementById('btnRefreshClassTable'),
    classMatrixTable: document.getElementById('classMatrixTable'),
    classMatrixTableBody: document.getElementById('classMatrixTableBody'),

    // Modals - Cell Detail (Teacher)
    cellDetailModal: document.getElementById('cellDetailModal'),
    cellDetailTitle: document.getElementById('cellDetailTitle'),
    cellDetailSubtitle: document.getElementById('cellDetailSubtitle'),
    btnCloseCellModal: document.getElementById('btnCloseCellModal'),
    btnDismissCellModal: document.getElementById('btnDismissCellModal'),
    tabTeaching: document.getElementById('tabTeaching'),
    tabFree: document.getElementById('tabFree'),
    tabSpecialModal: document.getElementById('tabSpecialModal'),
    paneTeaching: document.getElementById('paneTeaching'),
    paneFree: document.getElementById('paneFree'),
    paneSpecial: document.getElementById('paneSpecial'),
    countModalTeaching: document.getElementById('countModalTeaching'),
    countModalFree: document.getElementById('countModalFree'),
    countModalSpecial: document.getElementById('countModalSpecial'),
    tbodyTeaching: document.getElementById('tbodyTeaching'),
    tbodyFree: document.getElementById('tbodyFree'),
    tbodySpecial: document.getElementById('tbodySpecial'),
    btnCopyFreeList: document.getElementById('btnCopyFreeList'),

    // Teacher schedule modal
    teacherScheduleModal: document.getElementById('teacherScheduleModal'),
    btnCloseTeacherModal: document.getElementById('btnCloseTeacherModal'),
    btnDismissTeacherModal: document.getElementById('btnDismissTeacherModal'),
    teacherModalName: document.getElementById('teacherModalName'),
    teacherModalInfo: document.getElementById('teacherModalInfo'),
    tModalShort: document.getElementById('tModalShort'),
    tModalPhone: document.getElementById('tModalPhone'),
    tModalSubject: document.getElementById('tModalSubject'),
    tModalCN: document.getElementById('tModalCN'),
    tModalPeriods: document.getElementById('tModalPeriods'),
    tModalDetails: document.getElementById('tModalDetails'),
    tbodyTeacherSchedule: document.getElementById('tbodyTeacherSchedule'),

    // Class Schedule Modal
    classScheduleModal: document.getElementById('classScheduleModal'),
    classModalTitle: document.getElementById('classModalTitle'),
    classModalInfo: document.getElementById('classModalInfo'),
    cModalName: document.getElementById('cModalName'),
    cModalGrade: document.getElementById('cModalGrade'),
    cModalShift: document.getElementById('cModalShift'),
    cModalGVCN: document.getElementById('cModalGVCN'),
    cModalGVCNPhone: document.getElementById('cModalGVCNPhone'),
    cModalTotalPeriods: document.getElementById('cModalTotalPeriods'),
    tbodyClassSchedule: document.getElementById('tbodyClassSchedule'),
    btnCloseClassModal: document.getElementById('btnCloseClassModal'),
    btnDismissClassModal: document.getElementById('btnDismissClassModal'),

    // Class Cell Detail Modal
    classCellDetailModal: document.getElementById('classCellDetailModal'),
    classCellDetailTitle: document.getElementById('classCellDetailTitle'),
    classCellDetailSubtitle: document.getElementById('classCellDetailSubtitle'),
    btnCloseClassCellModal: document.getElementById('btnCloseClassCellModal'),
    btnDismissClassCellModal: document.getElementById('btnDismissClassCellModal'),
    tabClassLearning: document.getElementById('tabClassLearning'),
    tabClassFree: document.getElementById('tabClassFree'),
    tabClassSpecialModal: document.getElementById('tabClassSpecialModal'),
    paneClassLearning: document.getElementById('paneClassLearning'),
    paneClassFree: document.getElementById('paneClassFree'),
    paneClassSpecial: document.getElementById('paneClassSpecial'),
    countClassModalLearning: document.getElementById('countClassModalLearning'),
    countClassModalFree: document.getElementById('countClassModalFree'),
    countClassModalSpecial: document.getElementById('countClassModalSpecial'),
    tbodyClassLearning: document.getElementById('tbodyClassLearning'),
    tbodyClassFree: document.getElementById('tbodyClassFree'),
    tbodyClassSpecial: document.getElementById('tbodyClassSpecial'),
    btnCopyClassFreeList: document.getElementById('btnCopyClassFreeList'),

    // Upload modal
    btnOpenUploadModal: document.getElementById('btnOpenUploadModal'),
    uploadModal: document.getElementById('uploadModal'),
    btnCloseUploadModal: document.getElementById('btnCloseUploadModal'),
    btnDismissUploadModal: document.getElementById('btnDismissUploadModal'),
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    btnBrowseFile: document.getElementById('btnBrowseFile'),
    selectedFileInfo: document.getElementById('selectedFileInfo'),
    btnSubmitUpload: document.getElementById('btnSubmitUpload'),
    uploadStatus: document.getElementById('uploadStatus'),

    // Guide modal
    btnOpenGuideModal: document.getElementById('btnOpenGuideModal'),
    guideModal: document.getElementById('guideModal'),
    btnCloseGuideModal: document.getElementById('btnCloseGuideModal'),
    btnDismissGuideModal: document.getElementById('btnDismissGuideModal'),

    // Bell schedule & Time editing
    btnOpenBellModal: document.getElementById('btnOpenBellModal'),
    btnEditBellSchedule: document.getElementById('btnEditBellSchedule'),
    btnEditBellScheduleClass: document.getElementById('btnEditBellScheduleClass'),
    bellScheduleModal: document.getElementById('bellScheduleModal'),
    btnCloseBellModal: document.getElementById('btnCloseBellModal'),
    btnDismissBellModal: document.getElementById('btnDismissBellModal'),
    tbodyBellManage: document.getElementById('tbodyBellManage'),
    bellRecessInfo: document.getElementById('bellRecessInfo'),
    btnSaveAllBellSchedule: document.getElementById('btnSaveAllBellSchedule'),
    btnResetBellSchedule: document.getElementById('btnResetBellSchedule'),
    toastContainer: document.getElementById('toastContainer'),

    // In-app Confirmation Modal
    appConfirmModal: document.getElementById('appConfirmModal'),
    appConfirmTitle: document.getElementById('appConfirmTitle'),
    appConfirmMessage: document.getElementById('appConfirmMessage'),
    btnCloseAppConfirm: document.getElementById('btnCloseAppConfirm'),
    btnCancelAppConfirm: document.getElementById('btnCancelAppConfirm'),
    btnOkAppConfirm: document.getElementById('btnOkAppConfirm'),

    // Exit & Shutdown
    btnTriggerExit: document.getElementById('btnTriggerExit'),
    exitConfirmModal: document.getElementById('exitConfirmModal'),
    btnCloseExitModal: document.getElementById('btnCloseExitModal'),
    btnCancelExit: document.getElementById('btnCancelExit'),
    btnConfirmExit: document.getElementById('btnConfirmExit'),
    shutdownScreen: document.getElementById('shutdownScreen')
};

let selectedUploadFile = null;

// =========================================================
// AUTHENTICATION & LOGIN GATE LOGIC (WEB / GOOGLE LOGIN)
// =========================================================
function getStoredAuthToken() {
    return localStorage.getItem('tkb_jwt_token') || '';
}

function setStoredAuthToken(token) {
    if (token) {
        localStorage.setItem('tkb_jwt_token', token);
    } else {
        localStorage.removeItem('tkb_jwt_token');
    }
}

function setupAuthListeners() {
    if (el.btnDemoLogin) {
        el.btnDemoLogin.onclick = handleDemoLogin;
    }
    if (el.btnLogout) {
        el.btnLogout.onclick = handleLogout;
    }
    if (el.btnMenuLogout) {
        el.btnMenuLogout.onclick = () => {
            if (el.settingsDropdownMenu) el.settingsDropdownMenu.style.display = 'none';
            handleLogout();
        };
    }
}

async function checkAuthAndInit() {
    setupAuthListeners();
    try {
        const res = await fetch('/api/auth/config');
        if (!res.ok) throw new Error('Không lấy được cấu hình đăng nhập');
        state.authConfig = await res.json();
    } catch (e) {
        console.warn('Lỗi lấy auth config, tiếp tục chế độ cục bộ:', e);
        state.authConfig = { auth_enabled: false, google_client_id: '', allow_demo_login: true, is_web: false };
    }

    // Adapt UI if running on Web
    if (state.authConfig && state.authConfig.is_web) {
        if (el.btnOpenUploadModal) el.btnOpenUploadModal.style.display = 'block';
        if (el.btnTriggerExit) el.btnTriggerExit.style.display = 'none';
        if (el.btnMenuLogout) el.btnMenuLogout.style.display = 'block';
    }

    if (!state.authConfig || !state.authConfig.auth_enabled) {
        if (el.loginGateOverlay) el.loginGateOverlay.style.display = 'none';
        if (!state.appInitialized) {
            state.appInitialized = true;
            await initApp();
        }
        return;
    }

    // Auth is enabled -> check existing token
    const token = getStoredAuthToken();
    if (token) {
        try {
            const meRes = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (meRes.ok) {
                const meData = await meRes.json();
                applyAuthenticatedUser(meData.user, token);
                if (!state.appInitialized) {
                    state.appInitialized = true;
                    await initApp();
                }
                return;
            } else {
                setStoredAuthToken('');
            }
        } catch (e) {
            console.warn('Lỗi xác thực phiên đăng nhập:', e);
            setStoredAuthToken('');
        }
    }

    // Not authenticated -> show Login Gate
    showLoginGate();
}

function showLoginGate(errorMessage = '') {
    if (el.loginGateOverlay) el.loginGateOverlay.style.display = 'flex';
    if (el.userProfileBadge) el.userProfileBadge.style.display = 'none';

    if (errorMessage && el.loginErrorAlert) {
        el.loginErrorAlert.textContent = errorMessage;
        el.loginErrorAlert.style.display = 'block';
    } else if (el.loginErrorAlert) {
        el.loginErrorAlert.style.display = 'none';
    }

    // Setup Demo login button
    if (el.demoLoginWrapper) {
        el.demoLoginWrapper.style.display = state.authConfig?.allow_demo_login ? 'block' : 'none';
    }

    // Render Google Sign In button if client_id exists
    renderGoogleSignInButton();
}

function renderGoogleSignInButton() {
    const clientId = state.authConfig?.google_client_id;
    const container = el.googleSignInBtnContainer;
    if (!container) return;

    if (!clientId) {
        container.innerHTML = `
            <div style="font-size: 12.5px; color: #475569; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px dashed #cbd5e1; max-width: 320px; margin: 0 auto;">
                Chưa cài đặt Google Client ID trên Cloud.<br>
                <small style="color: #0284c7;">Thầy có thể bấm nút <strong>Đăng nhập thử nghiệm</strong> bên dưới để vào hệ thống ngay.</small>
            </div>
        `;
        return;
    }

    function tryRenderGIS() {
        if (window.google && google.accounts && google.accounts.id) {
            try {
                const gisConfig = {
                    client_id: clientId,
                    callback: handleGoogleCredentialResponse,
                    auto_select: false
                };
                const primaryDomain = state.authConfig?.allowed_domains?.split(',')[0]?.trim();
                if (primaryDomain && primaryDomain !== '*') {
                    gisConfig.hd = primaryDomain;
                }
                google.accounts.id.initialize(gisConfig);
                container.innerHTML = '';
                google.accounts.id.renderButton(container, {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: 280
                });
            } catch (err) {
                console.error('Lỗi khởi tạo Google GIS:', err);
            }
        } else {
            setTimeout(tryRenderGIS, 250);
        }
    }
    tryRenderGIS();
}

async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
        showLoginGate('Không nhận được thông tin xác thực từ Google.');
        return;
    }
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (!res.ok) {
            showLoginGate(data.detail || 'Đăng nhập không thành công.');
            return;
        }
        setStoredAuthToken(data.token);
        applyAuthenticatedUser(data.user, data.token);
        if (!state.appInitialized) {
            state.appInitialized = true;
            await initApp();
        }
    } catch (e) {
        showLoginGate('Lỗi kết nối máy chủ xác thực: ' + e.message);
    }
}

async function handleDemoLogin() {
    if (el.btnDemoLogin) {
        el.btnDemoLogin.disabled = true;
        el.btnDemoLogin.textContent = 'Đang đăng nhập...';
    }
    try {
        const res = await fetch('/api/auth/demo-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'giaovien.demo@ninhthuan.edu.vn',
                name: 'Thầy Cô Giáo Viên (Sở GD&ĐT Ninh Thuận)'
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showLoginGate(data.detail || 'Lỗi đăng nhập thử nghiệm.');
            return;
        }
        setStoredAuthToken(data.token);
        applyAuthenticatedUser(data.user, data.token);
        if (!state.appInitialized) {
            state.appInitialized = true;
            await initApp();
        }
    } catch (e) {
        showLoginGate('Lỗi kết nối demo login: ' + e.message);
    } finally {
        if (el.btnDemoLogin) {
            el.btnDemoLogin.disabled = false;
            el.btnDemoLogin.textContent = 'Đăng nhập thử nghiệm (Demo BGH)';
        }
    }
}
window.handleDemoLogin = handleDemoLogin;
window.handleLogout = handleLogout;

function applyAuthenticatedUser(user, token) {
    state.currentUser = user;
    if (el.loginGateOverlay) el.loginGateOverlay.style.display = 'none';

    if (el.userProfileBadge && user) {
        el.userProfileBadge.style.display = 'flex';
        if (el.userDisplayName) el.userDisplayName.textContent = user.name || 'Người dùng';
        if (el.userDisplayEmail) el.userDisplayEmail.textContent = user.email || '';
        
        if (user.picture && el.userAvatarImg) {
            el.userAvatarImg.src = user.picture;
            el.userAvatarImg.style.display = 'block';
            if (el.userAvatarInitial) el.userAvatarInitial.style.display = 'none';
        } else if (el.userAvatarInitial) {
            const firstLetter = (user.name || user.email || 'G').charAt(0).toUpperCase();
            el.userAvatarInitial.textContent = firstLetter;
            el.userAvatarInitial.style.display = 'flex';
            if (el.userAvatarImg) el.userAvatarImg.style.display = 'none';
        }
    }
}

function handleLogout() {
    showInAppConfirm(
        'Xác nhận Đăng xuất',
        'Thầy cô có chắc chắn muốn đăng xuất khỏi hệ thống?',
        () => {
            setStoredAuthToken('');
            state.currentUser = null;
            window.location.reload();
        },
        'btn-danger',
        'Đăng xuất'
    );
}

// =========================================================
// 1. INITIALIZATION & DATA FETCHING
// =========================================================
async function initApp() {
    setupEventListeners();
    startClock();
    await fetchMetadata();
    await fetchBellSchedule();
    await fetchSubjects();
    await fetchClasses();
    await fetchHomeroomTeachers();
    await fetchClassSubjects();
    await populateClassSelectForSchedule();
    await refreshAllData();
    setInterval(pollRealtimeStatus, 15000);
}

function startClock() {
    function update() {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        el.liveClock.textContent = timeStr;
        
        const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayStr = days[now.getDay()];
        const dateStr = `${dayStr}, ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
        el.liveDate.textContent = dateStr;
    }
    update();
    setInterval(update, 1000);
}

async function fetchMetadata() {
    try {
        const res = await fetch('/api/metadata');
        if (!res.ok) return;
        const meta = await res.json();
        if (meta.school_name) el.schoolName.textContent = meta.school_name;
        if (meta.school_year) el.metaYear.textContent = meta.school_year;
        if (meta.semester) el.metaSemester.textContent = meta.semester;
    } catch (e) {
        console.error('Lỗi tải metadata:', e);
    }
}

async function fetchSubjects() {
    try {
        const res = await fetch('/api/subjects');
        if (!res.ok) return;
        const subjects = await res.json();
        el.filterSubject.innerHTML = '<option value="all">Tất cả các tổ môn</option>';
        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = `Tổ ${sub}`;
            el.filterSubject.appendChild(opt);
        });
    } catch (e) {
        console.error('Lỗi tải subjects:', e);
    }
}

async function fetchClasses() {
    try {
        const res = await fetch('/api/classes');
        if (!res.ok) return;
        const classes = await res.json();
        if (!el.filterClass) return;
        
        el.filterClass.innerHTML = '<option value="all">Tất cả các lớp</option>';
        
        const groups = {
            'Khối 10': [],
            'Khối 11': [],
            'Khối 12': [],
            'Lớp khác': []
        };
        
        classes.forEach(c => {
            const name = typeof c === 'string' ? c : (c.name || '');
            if (!name) return;
            const label = typeof c === 'object' && c.homeroom_teacher 
                ? `Lớp ${name} (CN: ${c.homeroom_teacher})` 
                : `Lớp ${name}`;
            const item = { value: name, label: label };
            
            if (name.startsWith('10')) groups['Khối 10'].push(item);
            else if (name.startsWith('11')) groups['Khối 11'].push(item);
            else if (name.startsWith('12')) groups['Khối 12'].push(item);
            else groups['Lớp khác'].push(item);
        });
        
        Object.entries(groups).forEach(([grpName, clsList]) => {
            if (clsList.length > 0) {
                const optGroup = document.createElement('optgroup');
                optGroup.label = grpName;
                clsList.forEach(cls => {
                    const opt = document.createElement('option');
                    opt.value = cls.value;
                    opt.textContent = cls.label;
                    optGroup.appendChild(opt);
                });
                el.filterClass.appendChild(optGroup);
            }
        });
    } catch (e) {
        console.error('Lỗi tải classes:', e);
    }
}

async function fetchBellSchedule() {
    try {
        const res = await fetch('/api/bell-schedule');
        if (!res.ok) return;
        state.bellSchedule = await res.json();
    } catch (e) {
        console.error('Lỗi tải bell schedule:', e);
    }
}

async function pollRealtimeStatus() {
    try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();
        state.statusInfo = data;
        
        const p = data.period_info;
        el.livePeriodBadge.textContent = p.status_label;
        if (p.is_school_time) {
            el.livePeriodBadge.style.background = 'rgba(21, 128, 61, 0.25)';
            el.livePeriodBadge.style.color = '#86efac';
        } else {
            el.livePeriodBadge.style.background = 'rgba(202, 138, 4, 0.25)';
            el.livePeriodBadge.style.color = '#fef08a';
        }
        
        // Update Teacher Stats if in realtime
        if (data.counts && state.mode === 'realtime') {
            el.statTotal.textContent = data.counts.total;
            el.statTeaching.textContent = data.counts.teaching;
            el.statFree.textContent = data.counts.free;
            el.statSpecial.textContent = data.counts.special + data.counts.salute;
        }

        // Update Class Stats if in realtime
        if (data.class_counts && state.mode === 'realtime') {
            el.statClassTotal.textContent = data.class_counts.total;
            el.statClassLearning.textContent = data.class_counts.learning;
            el.statClassFree.textContent = data.class_counts.free;
            el.statClassSpecial.textContent = data.class_counts.special;
        }
        
        if (state.mode === 'realtime') {
            if (state.activeTab === 'teacher') {
                fetchTeachers();
            } else {
                fetchClassesStatus();
            }
        }
    } catch (e) {
        console.error('Lỗi poll status:', e);
    }
}

async function refreshAllData() {
    await pollRealtimeStatus();
    await fetchTeachers();
    await fetchClassesStatus();
    await fetchMatrix();
    await fetchClassesMatrix();
}

// =========================================================
// 2. TEACHERS LIST LOGIC & RENDERING (CARD & GRID)
// =========================================================
async function fetchTeachers() {
    try {
        let url = `/api/teachers?mode=${state.mode}`;
        if (state.mode === 'custom') {
            url += `&day=${state.targetDay}&session=${state.targetSession}&period=${state.targetPeriod}`;
        }
        if (state.search) url += `&search=${encodeURIComponent(state.search)}`;
        if (state.subject && state.subject !== 'all') url += `&subject=${encodeURIComponent(state.subject)}`;
        if (state.class_name && state.class_name !== 'all') url += `&class_name=${encodeURIComponent(state.class_name)}`;
        if (state.status && state.status !== 'all') url += `&status=${encodeURIComponent(state.status)}`;

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        state.teachers = data.teachers;

        const t = data.target_time;
        el.targetTimeLabel.textContent = `Đang xem: ${t.day_name} | ${t.period_label}`;

        // Update stats
        el.statTotal.textContent = data.counts.total;
        el.statTeaching.textContent = data.counts.teaching;
        el.statFree.textContent = data.counts.free;
        el.statSpecial.textContent = data.counts.special + data.counts.salute;

        // Render current view
        if (state.activeView === 'card') {
            renderTeacherCards(data.teachers);
        } else if (state.activeView === 'grid') {
            renderTeacherGrid(data.teachers);
        }
    } catch (e) {
        console.error('Lỗi tải danh sách giáo viên:', e);
    }
}

function renderTeacherCards(teachers) {
    el.teachersCardGrid.innerHTML = '';
    if (!teachers || teachers.length === 0) {
        el.emptyStateCards.style.display = 'block';
        const h3 = el.emptyStateCards.querySelector('h3');
        const p = el.emptyStateCards.querySelector('p');
        if (state.class_name && state.class_name !== 'all' && state.status === 'teaching') {
            if (h3) h3.textContent = `Lớp ${state.class_name} không có tiết học ở khung giờ này`;
            if (p) p.textContent = 'Vào thời điểm này, lớp không có giáo viên nào đứng lớp (lớp không có tiết hoặc đang nghỉ).';
        } else {
            if (h3) h3.textContent = 'Không tìm thấy giáo viên nào';
            if (p) p.textContent = 'Vui lòng thử lại với từ khóa hoặc bộ lọc khác.';
        }
        return;
    }
    el.emptyStateCards.style.display = 'none';

    teachers.forEach(t => {
        const card = document.createElement('div');
        card.className = `teacher-card ${t.color_border}`;
        
        const words = t.full_name.trim().split(' ');
        const initials = words.length >= 2 ? words[words.length - 2][0] + words[words.length - 1][0] : t.full_name.substring(0, 2);

        let bannerText = t.status_label;
        if (t.status_code === 'free') {
            bannerText = 'Trống tiết / Đang rảnh';
        } else if (t.status_code === 'salute') {
            bannerText = 'Chào cờ toàn trường';
        } else if (t.status_code === 'special') {
            bannerText = t.cell_text || 'Giao ban / Hội ý';
        }

        card.innerHTML = `
            <div class="card-header-top">
                <div class="teacher-identity">
                    <div class="teacher-avatar">${initials.toUpperCase()}</div>
                    <div class="teacher-name-box">
                        <span class="teacher-name">${t.full_name}</span>
                        <span class="teacher-shortcode">Mã TKB: <strong>${t.short_name || '---'}</strong></span>
                    </div>
                </div>
                <span class="badge-tt">STT: ${t.tt}</span>
            </div>

            <div class="card-status-banner ${t.badge_color}">
                <span>${bannerText}</span>
            </div>

            <div class="card-details-list">
                <div class="detail-row detail-phone">
                    <span class="detail-label">Điện thoại:</span>
                    <span class="detail-val">
                        ${t.phone ? `
                            <a href="tel:${t.phone.replace(/\s+/g, '')}" class="phone-link" title="Bấm để gọi">${t.phone}</a>
                            <button class="btn-copy-phone" data-phone="${t.phone}" title="Sao chép số điện thoại">Chép</button>
                        ` : '<span class="text-not-found">Không tìm thấy</span>'}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tổ bộ môn:</span>
                    <span class="detail-val">Tổ ${t.subject_group || 'Khác'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lớp chủ nhiệm:</span>
                    <span class="detail-val">${t.homeroom_class ? `<span class="tag-cn">Lớp ${t.homeroom_class}</span>` : '<span class="text-muted">Không</span>'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Định mức tiết:</span>
                    <span class="detail-val"><strong>${t.periods_count}</strong> tiết/tuần</span>
                </div>
            </div>

            <div class="card-footer-action">
                <button class="btn-card-schedule" data-id="${t.id}">
                    Xem TKB tuần
                </button>
            </div>
        `;

        card.querySelector('.btn-card-schedule').addEventListener('click', () => {
            openTeacherScheduleModal(t.id);
        });

        const copyBtn = card.querySelector('.btn-copy-phone');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const phone = copyBtn.getAttribute('data-phone');
                navigator.clipboard.writeText(phone.replace(/\s+/g, '')).then(() => {
                    copyBtn.textContent = 'Đã chép';
                    setTimeout(() => { copyBtn.textContent = 'Chép'; }, 1500);
                });
            });
        }

        const phoneLink = card.querySelector('.phone-link');
        if (phoneLink) {
            phoneLink.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        el.teachersCardGrid.appendChild(card);
    });
}

// VIEW 2: Dạng Lưới (Compact Photo-like Grid)
function renderTeacherGrid(teachers) {
    el.teachersCompactGrid.innerHTML = '';
    if (!teachers || teachers.length === 0) {
        el.emptyStateGrid.style.display = 'block';
        const h3 = el.emptyStateGrid.querySelector('h3');
        const p = el.emptyStateGrid.querySelector('p');
        if (state.class_name && state.class_name !== 'all' && state.status === 'teaching') {
            if (h3) h3.textContent = `Lớp ${state.class_name} không có tiết học ở khung giờ này`;
            if (p) p.textContent = 'Vào thời điểm này, lớp không có giáo viên nào đứng lớp (lớp không có tiết hoặc đang nghỉ).';
        } else {
            if (h3) h3.textContent = 'Không tìm thấy giáo viên nào';
            if (p) p.textContent = 'Vui lòng thử lại với từ khóa hoặc bộ lọc khác.';
        }
        return;
    }
    el.emptyStateGrid.style.display = 'none';

    teachers.forEach(t => {
        const tile = document.createElement('div');
        tile.className = `grid-tile ${t.color_border}`;
        tile.title = `Bấm để xem TKB tuần của thầy/cô ${t.full_name}`;

        const words = t.full_name.trim().split(' ');
        const initials = words.length >= 2 ? words[words.length - 2][0] + words[words.length - 1][0] : t.full_name.substring(0, 2);

        let pillText = 'Đang rảnh';
        if (t.status_code === 'teaching') {
            pillText = `${t.current_subject} - ${t.current_class}`;
        } else if (t.status_code === 'salute') {
            pillText = 'Chào cờ';
        } else if (t.status_code === 'special') {
            pillText = t.cell_text || 'Giao ban';
        }

        tile.innerHTML = `
            <div class="tile-avatar">${initials.toUpperCase()}</div>
            <div class="tile-name">${t.full_name}</div>
            <div class="tile-phone">
                ${t.phone ? `<a href="tel:${t.phone.replace(/\s+/g, '')}" title="Bấm để gọi">${t.phone}</a>` : '<span class="text-not-found">Không tìm thấy</span>'}
            </div>
            <div class="tile-meta">Mã: <strong>${t.short_name || '---'}</strong> | Tổ ${t.subject_group || ''}</div>
            <div class="tile-status-pill ${t.badge_color}">${pillText}</div>
        `;

        const phoneLink = tile.querySelector('.tile-phone a');
        if (phoneLink) {
            phoneLink.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        tile.addEventListener('click', () => {
            openTeacherScheduleModal(t.id);
        });

        el.teachersCompactGrid.appendChild(tile);
    });
}

// =========================================================
// 3. TABLE VIEW (BẢNG THỜI KHÓA BIỂU)
// =========================================================
async function fetchMatrix() {
    try {
        const res = await fetch('/api/matrix');
        if (!res.ok) return;
        state.matrix = await res.json();
        renderMatrixTable(state.matrix);
    } catch (e) {
        console.error('Lỗi tải bảng TKB:', e);
    }
}

function showToast(message, type = 'success') {
    if (!el.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let activeConfirmCallback = null;

function showInAppConfirm(title, message, onConfirm, okButtonClass = 'btn-primary', okButtonText = 'Đồng ý') {
    if (!el.appConfirmModal) {
        if (window.confirm(message)) onConfirm();
        return;
    }
    if (el.appConfirmTitle) el.appConfirmTitle.textContent = title;
    if (el.appConfirmMessage) el.appConfirmMessage.innerHTML = message.replace(/\n/g, '<br>');
    if (el.btnOkAppConfirm) {
        el.btnOkAppConfirm.className = `btn ${okButtonClass}`;
        el.btnOkAppConfirm.textContent = okButtonText;
    }
    activeConfirmCallback = onConfirm;
    el.appConfirmModal.classList.add('show');
    el.appConfirmModal.style.display = 'flex';
}

function closeInAppConfirm() {
    if (el.appConfirmModal) {
        el.appConfirmModal.classList.remove('show');
        el.appConfirmModal.style.display = 'none';
    }
    activeConfirmCallback = null;
}

function renderTimeCellContent(tdTime, session, period) {
    const item = state.bellSchedule.find(s => s.session === session && s.period === period);
    const start = item ? item.start_time : '';
    const end = item ? item.end_time : '';
    const s_label = session === 'sang' ? 'Sáng' : 'Chiều';
    tdTime.innerHTML = `
        <span class="time-range-text">${start} - ${end}</span>
        <span class="time-edit-badge" title="Bấm để sửa khung giờ Tiết ${period} ${s_label}">Sửa</span>
    `;
    tdTime.onclick = (e) => {
        e.stopPropagation();
        startInlineTimeEdit(tdTime, session, period);
    };
}

function startInlineTimeEdit(tdTime, session, period) {
    if (tdTime.querySelector('.inline-bell-editor')) return;
    
    const item = state.bellSchedule.find(s => s.session === session && s.period === period);
    const curStart = item ? item.start_time : (session === 'sang' ? '07:00' : '13:15');
    const curEnd = item ? item.end_time : (session === 'sang' ? '07:45' : '14:00');
    const s_label = session === 'sang' ? 'Sáng' : 'Chiều';

    tdTime.innerHTML = `
        <div class="inline-bell-editor" onclick="event.stopPropagation()">
            <input type="text" class="inline-time-input" id="inline_start_${session}_${period}" value="${curStart}" maxlength="5" placeholder="HH:MM" autocomplete="off">
            <span class="inline-sep">-</span>
            <input type="text" class="inline-time-input" id="inline_end_${session}_${period}" value="${curEnd}" maxlength="5" placeholder="HH:MM" autocomplete="off">
            <button class="btn-inline-save" id="btnSaveInline_${session}_${period}">Lưu</button>
            <button class="btn-inline-cancel" id="btnCancelInline_${session}_${period}">Hủy</button>
        </div>
    `;

    const timeInputs = tdTime.querySelectorAll('.inline-time-input');
    const sInp = timeInputs[0];
    const eInp = timeInputs[1];
    const btnSave = tdTime.querySelector('.btn-inline-save');
    const btnCancel = tdTime.querySelector('.btn-inline-cancel');

    sInp.focus();

    async function doSave() {
        const newStart = sInp.value.trim();
        const newEnd = eInp.value.trim();
        if (!newStart || !newEnd) {
            showToast('Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc!', 'error');
            return;
        }
        if (newStart >= newEnd) {
            showToast('Giờ bắt đầu phải trước giờ kết thúc!', 'error');
            return;
        }

        try {
            const res = await fetch('/api/bell-schedule/period', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session,
                    period,
                    start_time: newStart,
                    end_time: newEnd,
                    label: `Tiết ${period} ${s_label}`
                })
            });
            if (!res.ok) throw new Error('Máy chủ báo lỗi');
            
            showToast(`Đã lưu Tiết ${period} ${s_label}: ${newStart} - ${newEnd}`);
            await fetchBellSchedule();
            await pollRealtimeStatus();
            if (state.matrix) renderMatrixTable(state.matrix);
            if (state.classMatrix) renderClassMatrixTable(state.classMatrix);
        } catch (err) {
            showToast('Lỗi khi lưu khung giờ: ' + err.message, 'error');
            renderTimeCellContent(tdTime, session, period);
        }
    }

    btnSave.onclick = (e) => {
        e.stopPropagation();
        doSave();
    };

    btnCancel.onclick = (e) => {
        e.stopPropagation();
        renderTimeCellContent(tdTime, session, period);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            renderTimeCellContent(tdTime, session, period);
        }
    };
    sInp.addEventListener('keydown', handleKey);
    eInp.addEventListener('keydown', handleKey);
}

function renderMatrixTable(matrixData) {
    if (!matrixData || !matrixData.grid) return;
    const grid = matrixData.grid;
    const tbody = el.matrixTableBody;
    tbody.innerHTML = '';

    const curStatus = state.statusInfo ? state.statusInfo.period_info : null;
    const curDay = curStatus ? curStatus.day_of_week : null;
    const curSession = curStatus ? curStatus.session : null;
    const curPeriod = curStatus ? curStatus.period : null;

    // 1. BUỔI SÁNG
    for (let p = 1; p <= 5; p++) {
        if (p === 3) {
            const t2 = state.bellSchedule.find(s => s.session === 'sang' && s.period === 2);
            const t3 = state.bellSchedule.find(s => s.session === 'sang' && s.period === 3);
            const rStart = t2 ? t2.end_time : '08:35';
            const rEnd = t3 ? t3.start_time : '08:55';
            const recessRow = document.createElement('tr');
            recessRow.className = 'recess-row';
            recessRow.innerHTML = `<td colspan="9">RA CHƠI BUỔI SÁNG (${rStart} - ${rEnd})</td>`;
            tbody.appendChild(recessRow);
        }

        const tr = document.createElement('tr');
        if (p === 1) {
            const tdSession = document.createElement('td');
            tdSession.rowSpan = 6;
            tdSession.className = 'matrix-session-header';
            tdSession.innerHTML = '<strong>BUỔI SÁNG</strong>';
            tr.appendChild(tdSession);
        }

        const tdPeriod = document.createElement('td');
        tdPeriod.className = 'matrix-period-cell editable-period-cell';
        tdPeriod.textContent = `Tiết ${p}`;
        tdPeriod.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Sáng`;

        const tdTime = document.createElement('td');
        tdTime.className = 'matrix-time-cell editable-time-cell';
        tdTime.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Sáng`;
        renderTimeCellContent(tdTime, 'sang', p);

        tdPeriod.addEventListener('click', (e) => {
            e.stopPropagation();
            startInlineTimeEdit(tdTime, 'sang', p);
        });

        tr.appendChild(tdPeriod);
        tr.appendChild(tdTime);

        for (let d = 2; d <= 7; d++) {
            const tdData = document.createElement('td');
            tdData.className = 'matrix-data-cell';
            const cellStats = grid[d]?.sang?.[p] || { teaching: 0, free: 0, special: 0, salute: 0 };

            if (curDay === d && curSession === 'sang' && curPeriod === p) {
                tdData.classList.add('active-now');
            }

            let specialBadge = '';
            if (cellStats.salute > 0) {
                specialBadge = `<div class="cell-pill-special">Chào cờ (${cellStats.salute})</div>`;
            } else if (cellStats.special > 0) {
                specialBadge = `<div class="cell-pill-special">Giao ban (${cellStats.special})</div>`;
            }

            tdData.innerHTML = `
                <div class="matrix-cell-content">
                    <div class="cell-pill-teaching">
                        <span>Đang dạy:</span>
                        <strong>${cellStats.teaching} GV</strong>
                    </div>
                    <div class="cell-pill-free">
                        <span>Đang rảnh:</span>
                        <strong>${cellStats.free} GV</strong>
                    </div>
                    ${specialBadge}
                </div>
            `;

            tdData.addEventListener('click', () => {
                openCellDetailModal(d, 'sang', p);
            });

            tr.appendChild(tdData);
        }

        tbody.appendChild(tr);
    }

    // NGHỈ TRƯA
    const m5 = state.bellSchedule.find(s => s.session === 'sang' && s.period === 5);
    const a1 = state.bellSchedule.find(s => s.session === 'chieu' && s.period === 1);
    const lStart = m5 ? m5.end_time : '11:20';
    const lEnd = a1 ? a1.start_time : '13:15';
    const lunchRow = document.createElement('tr');
    lunchRow.className = 'recess-row';
    lunchRow.style.background = '#e2e8f0';
    lunchRow.innerHTML = `<td colspan="9" style="font-weight: 800; color: #0f2438; padding: 8px;">NGHỈ TRƯA (${lStart} - ${lEnd})</td>`;
    tbody.appendChild(lunchRow);

    // 2. BUỔI CHIỀU
    for (let p = 1; p <= 5; p++) {
        if (p === 3) {
            const t2 = state.bellSchedule.find(s => s.session === 'chieu' && s.period === 2);
            const t3 = state.bellSchedule.find(s => s.session === 'chieu' && s.period === 3);
            const rStart = t2 ? t2.end_time : '14:50';
            const rEnd = t3 ? t3.start_time : '15:10';
            const recessRow = document.createElement('tr');
            recessRow.className = 'recess-row';
            recessRow.innerHTML = `<td colspan="9">RA CHƠI BUỔI CHIỀU (${rStart} - ${rEnd})</td>`;
            tbody.appendChild(recessRow);
        }

        const tr = document.createElement('tr');
        if (p === 1) {
            const tdSession = document.createElement('td');
            tdSession.rowSpan = 6;
            tdSession.className = 'matrix-session-header';
            tdSession.style.background = '#fef3c7';
            tdSession.style.color = '#92400e';
            tdSession.innerHTML = '<strong>BUỔI CHIỀU</strong>';
            tr.appendChild(tdSession);
        }

        const tdPeriod = document.createElement('td');
        tdPeriod.className = 'matrix-period-cell editable-period-cell';
        tdPeriod.textContent = `Tiết ${p}`;
        tdPeriod.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Chiều`;

        const tdTime = document.createElement('td');
        tdTime.className = 'matrix-time-cell editable-time-cell';
        tdTime.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Chiều`;
        renderTimeCellContent(tdTime, 'chieu', p);

        tdPeriod.addEventListener('click', (e) => {
            e.stopPropagation();
            startInlineTimeEdit(tdTime, 'chieu', p);
        });

        tr.appendChild(tdPeriod);
        tr.appendChild(tdTime);

        for (let d = 2; d <= 7; d++) {
            const tdData = document.createElement('td');
            tdData.className = 'matrix-data-cell';
            const cellStats = grid[d]?.chieu?.[p] || { teaching: 0, free: 0, special: 0, salute: 0 };

            if (curDay === d && curSession === 'chieu' && curPeriod === p) {
                tdData.classList.add('active-now');
            }

            let specialBadge = '';
            if (cellStats.salute > 0) {
                specialBadge = `<div class="cell-pill-special">Chào cờ (${cellStats.salute})</div>`;
            } else if (cellStats.special > 0) {
                specialBadge = `<div class="cell-pill-special">Giao ban (${cellStats.special})</div>`;
            }

            tdData.innerHTML = `
                <div class="matrix-cell-content">
                    <div class="cell-pill-teaching">
                        <span>Đang dạy:</span>
                        <strong>${cellStats.teaching} GV</strong>
                    </div>
                    <div class="cell-pill-free">
                        <span>Đang rảnh:</span>
                        <strong>${cellStats.free} GV</strong>
                    </div>
                    ${specialBadge}
                </div>
            `;

            tdData.addEventListener('click', () => {
                openCellDetailModal(d, 'chieu', p);
            });

            tr.appendChild(tdData);
        }

        tbody.appendChild(tr);
    }
}


// =========================================================
// 4. MODALS LOGIC
// =========================================================

// Modal 1: Open Cell Detail Modal
async function openCellDetailModal(day, session, period) {
    try {
        const res = await fetch(`/api/matrix/cell?day=${day}&session=${session}&period=${period}`);
        if (!res.ok) return;
        const data = await res.json();
        state.lastCellDetail = data;

        const dayNames = {2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu', 7: 'Thứ Bảy'};
        const sessionName = session === 'sang' ? 'Buổi Sáng' : 'Buổi Chiều';
        
        const bell = state.bellSchedule.find(b => b.session === session && b.period === period);
        const timeRange = bell ? `(${bell.start_time} - ${bell.end_time})` : '';

        el.cellDetailTitle.textContent = `${dayNames[day]} - ${sessionName} - Tiết ${period} ${timeRange}`;
        el.cellDetailSubtitle.textContent = `Tổng số 111 giáo viên: ${data.counts.teaching} đang dạy, ${data.counts.free} đang rảnh`;

        el.countModalTeaching.textContent = data.counts.teaching;
        el.countModalFree.textContent = data.counts.free;
        el.countModalSpecial.textContent = data.counts.special + data.counts.salute;

        // Populate Teaching
        el.tbodyTeaching.innerHTML = '';
        if (data.teaching.length === 0) {
            el.tbodyTeaching.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có giáo viên nào đang đứng lớp</td></tr>';
        } else {
            data.teaching.forEach((t, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td><strong>${t.full_name}</strong></td>
                    <td class="table-phone-cell">${t.phone ? `<a href="tel:${t.phone.replace(/\s+/g, '')}">${t.phone}</a>` : '<span class="text-not-found">Không tìm thấy</span>'}</td>
                    <td><span class="badge-tt">${t.short_name || '---'}</span></td>
                    <td>Tổ ${t.subject_group || 'Khác'}</td>
                    <td><strong>${t.subject}</strong></td>
                    <td><span class="tag-cn">${t.class_name}</span></td>
                `;
                el.tbodyTeaching.appendChild(tr);
            });
        }

        // Populate Free
        el.tbodyFree.innerHTML = '';
        if (data.free.length === 0) {
            el.tbodyFree.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có giáo viên rảnh</td></tr>';
        } else {
            data.free.forEach((t, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td><strong>${t.full_name}</strong></td>
                    <td class="table-phone-cell">${t.phone ? `<a href="tel:${t.phone.replace(/\s+/g, '')}">${t.phone}</a>` : '<span class="text-not-found">Không tìm thấy</span>'}</td>
                    <td><span class="badge-tt">${t.short_name || '---'}</span></td>
                    <td>Tổ ${t.subject_group || 'Khác'}</td>
                    <td>${t.homeroom_class ? `<span class="tag-cn">Lớp ${t.homeroom_class}</span>` : '<span class="text-muted">---</span>'}</td>
                    <td>${t.periods_count} tiết</td>
                `;
                el.tbodyFree.appendChild(tr);
            });
        }

        // Populate Special
        el.tbodySpecial.innerHTML = '';
        const allSpecials = [...data.salute, ...data.special];
        if (allSpecials.length === 0) {
            el.tbodySpecial.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không có hoạt động đặc biệt</td></tr>';
        } else {
            allSpecials.forEach((t, i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td><strong>${t.full_name}</strong></td>
                    <td class="table-phone-cell">${t.phone ? `<a href="tel:${t.phone.replace(/\s+/g, '')}">${t.phone}</a>` : '<span class="text-not-found">Không tìm thấy</span>'}</td>
                    <td><span class="badge-tt">${t.short_name || '---'}</span></td>
                    <td>Tổ ${t.subject_group || 'Khác'}</td>
                    <td><span class="badge-orange">${t.cell_text}</span></td>
                `;
                el.tbodySpecial.appendChild(tr);
            });
        }

        switchCellTab('teaching');
        el.cellDetailModal.classList.add('show');
    } catch (e) {
        console.error('Lỗi mở chi tiết ô:', e);
    }
}

function switchCellTab(tabName) {
    el.tabTeaching.classList.remove('active');
    el.tabFree.classList.remove('active');
    el.tabSpecialModal.classList.remove('active');
    el.paneTeaching.classList.remove('active');
    el.paneFree.classList.remove('active');
    el.paneSpecial.classList.remove('active');

    if (tabName === 'teaching') {
        el.tabTeaching.classList.add('active');
        el.paneTeaching.classList.add('active');
    } else if (tabName === 'free') {
        el.tabFree.classList.add('active');
        el.paneFree.classList.add('active');
    } else if (tabName === 'special') {
        el.tabSpecialModal.classList.add('active');
        el.paneSpecial.classList.add('active');
    }
}

// Modal 2: Open Teacher Weekly Schedule Modal
async function openTeacherScheduleModal(teacherId) {
    try {
        const res = await fetch(`/api/teacher/${teacherId}/schedule`);
        if (!res.ok) return;
        const data = await res.json();
        const teacher = data.teacher;
        const schedule = data.schedule;

        el.teacherModalName.textContent = `Thời khóa biểu tuần: ${teacher.full_name}`;
        el.teacherModalInfo.textContent = `Tổ ${teacher.subject_group} ${teacher.homeroom_class ? `| Lớp chủ nhiệm: ${teacher.homeroom_class}` : ''}`;
        
        el.tModalShort.textContent = teacher.short_name || '---';
        if (el.tModalPhone) {
            el.tModalPhone.innerHTML = teacher.phone 
                ? `<a href="tel:${teacher.phone.replace(/\s+/g, '')}" class="phone-link">${teacher.phone}</a>` 
                : '<span class="text-not-found">Không tìm thấy</span>';
        }
        el.tModalSubject.textContent = teacher.subject_group;
        el.tModalCN.textContent = teacher.homeroom_class ? `Lớp ${teacher.homeroom_class}` : 'Không';
        el.tModalPeriods.textContent = `${teacher.periods_count} tiết/tuần`;
        el.tModalDetails.textContent = teacher.details || '---';

        const tbody = el.tbodyTeacherSchedule;
        tbody.innerHTML = '';

        // Sáng 1..5
        for (let p = 1; p <= 5; p++) {
            const tr = document.createElement('tr');
            if (p === 1) {
                const tdSession = document.createElement('td');
                tdSession.rowSpan = 5;
                tdSession.style.fontWeight = 'bold';
                tdSession.textContent = 'Sáng';
                tr.appendChild(tdSession);
            }
            const tdPeriod = document.createElement('td');
            tdPeriod.textContent = `Tiết ${p}`;
            tr.appendChild(tdPeriod);

            for (let d = 2; d <= 7; d++) {
                const td = document.createElement('td');
                const val = schedule[d]?.sang?.[p] || '';
                if (val) {
                    if (val.includes('Giao ban') || val.includes('Chào cờ')) {
                        td.innerHTML = `<span class="schedule-cell-special">${val}</span>`;
                    } else {
                        td.innerHTML = `<span class="schedule-cell-occupied">${val}</span>`;
                    }
                } else {
                    td.innerHTML = '<span class="text-muted">-</span>';
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        // Chiều 1..5
        for (let p = 1; p <= 5; p++) {
            const tr = document.createElement('tr');
            if (p === 1) {
                const tdSession = document.createElement('td');
                tdSession.rowSpan = 5;
                tdSession.style.fontWeight = 'bold';
                tdSession.textContent = 'Chiều';
                tr.appendChild(tdSession);
            }
            const tdPeriod = document.createElement('td');
            tdPeriod.textContent = `Tiết ${p}`;
            tr.appendChild(tdPeriod);

            for (let d = 2; d <= 7; d++) {
                const td = document.createElement('td');
                const val = schedule[d]?.chieu?.[p] || '';
                if (val) {
                    if (val.includes('Giao ban') || val.includes('Chào cờ')) {
                        td.innerHTML = `<span class="schedule-cell-special">${val}</span>`;
                    } else {
                        td.innerHTML = `<span class="schedule-cell-occupied">${val}</span>`;
                    }
                } else {
                    td.innerHTML = '<span class="text-muted">-</span>';
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        el.teacherScheduleModal.classList.add('show');
    } catch (e) {
        console.error('Lỗi mở lịch tuần GV:', e);
    }
}

// Modal 3: Upload Excel File
function handleFileSelected(file) {
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast('Vui lòng chỉ chọn file Excel (.xlsx hoặc .xls)', 'warning');
        return;
    }
    selectedUploadFile = file;
    el.selectedFileInfo.style.display = 'block';
    el.selectedFileInfo.textContent = `Đã chọn: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    el.btnSubmitUpload.disabled = false;
    el.uploadStatus.style.display = 'none';
}

async function submitUploadFile() {
    if (!selectedUploadFile) return;

    const formData = new FormData();
    formData.append('file', selectedUploadFile);

    el.btnSubmitUpload.disabled = true;
    el.uploadStatus.className = 'upload-status';
    el.uploadStatus.style.display = 'block';
    el.uploadStatus.textContent = 'Đang tải lên và phân tích dữ liệu thời khóa biểu... Vui lòng đợi trong giây lát.';

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok && data.success) {
            el.uploadStatus.className = 'upload-status success';
            el.uploadStatus.innerHTML = `
                <strong>${data.message}</strong><br>
                Trường: ${data.metadata?.school_name || ''} (${data.metadata?.school_year || ''})
            `;
            await fetchMetadata();
            await fetchBellSchedule();
            await fetchSubjects();
            await fetchClasses();
            await refreshAllData();
            setTimeout(() => {
                el.uploadModal.classList.remove('show');
                selectedUploadFile = null;
                el.fileInput.value = '';
                el.selectedFileInfo.style.display = 'none';
                el.btnSubmitUpload.disabled = true;
            }, 2000);
        } else {
            el.uploadStatus.className = 'upload-status error';
            el.uploadStatus.textContent = `${data.detail || 'Không thể đọc file'}`;
            el.btnSubmitUpload.disabled = false;
        }
    } catch (e) {
        el.uploadStatus.className = 'upload-status error';
        el.uploadStatus.textContent = `Lỗi kết nối tới server: ${e.message}`;
        el.btnSubmitUpload.disabled = false;
    }
}

// Copy free teachers list
function copyFreeTeachersToClipboard() {
    if (!state.lastCellDetail || !state.lastCellDetail.free) return;
    const free = state.lastCellDetail.free;
    const title = el.cellDetailTitle.textContent;
    
    let text = `DANH SÁCH GIÁO VIÊN ĐANG RẢNH - ${title}\n`;
    text += `(Tổng số: ${free.length} giáo viên)\n`;
    text += `--------------------------------------------------\n`;
    free.forEach((t, i) => {
        const phoneStr = t.phone ? ` - SĐT: ${t.phone}` : ' - SĐT: Không tìm thấy';
        text += `${i + 1}. ${t.full_name} (${t.short_name || '---'}) - Tổ ${t.subject_group}${t.homeroom_class ? ` - CN: ${t.homeroom_class}` : ''}${phoneStr} - Định mức: ${t.periods_count} tiết\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        const prevText = el.btnCopyFreeList.textContent;
        el.btnCopyFreeList.textContent = 'Đã sao chép vào bộ nhớ tạm!';
        setTimeout(() => {
            el.btnCopyFreeList.textContent = prevText;
        }, 2000);
    }).catch(err => {
        showToast('Không thể sao chép: ' + err, 'error');
    });
}

// Modal: Bell Schedule & Period Time Manager
function openBellScheduleModal(highlightSession = null, highlightPeriod = null) {
    if (!el.bellScheduleModal) return;
    el.bellScheduleModal.classList.add('show');
    renderBellManageTable(highlightSession, highlightPeriod);
}

function renderBellManageTable(highlightSession = null, highlightPeriod = null) {
    if (!el.tbodyBellManage) return;
    el.tbodyBellManage.innerHTML = '';

    function calcDuration(start, end) {
        if (!start || !end) return '';
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return diff > 0 ? `${diff} phút` : '--';
    }

    const morning = state.bellSchedule.filter(s => s.session === 'sang').sort((a,b) => a.period - b.period);
    const afternoon = state.bellSchedule.filter(s => s.session === 'chieu').sort((a,b) => a.period - b.period);

    // 1. BUỔI SÁNG HEADER
    const rowSangHeader = document.createElement('tr');
    rowSangHeader.className = 'bell-session-divider';
    rowSangHeader.innerHTML = `<td colspan="6">BUỔI SÁNG (TIẾT 1 - TIẾT 5)</td>`;
    el.tbodyBellManage.appendChild(rowSangHeader);

    let targetInputToFocus = null;

    morning.forEach(item => {
        if (item.period === 3) {
            const t2 = morning.find(s => s.period === 2);
            const recessRow = document.createElement('tr');
            recessRow.className = 'bell-recess-row';
            const rStart = t2 ? t2.end_time : '08:35';
            const rEnd = item.start_time;
            const rDur = calcDuration(rStart, rEnd);
            recessRow.innerHTML = `
                <td colspan="6">
                    <span style="color: #0f2438; font-weight: 700;">RA CHƠI BUỔI SÁNG:</span> 
                    <strong>${rStart} - ${rEnd}</strong> (${rDur})
                </td>
            `;
            el.tbodyBellManage.appendChild(recessRow);
        }

        const tr = document.createElement('tr');
        const isTarget = highlightSession === 'sang' && highlightPeriod === item.period;
        if (isTarget) tr.classList.add('highlight-target');

        const dur = calcDuration(item.start_time, item.end_time);

        tr.innerHTML = `
            <td><strong>Tiết ${item.period} Sáng</strong></td>
            <td>
                <input type="time" class="bell-time-input" id="modal_start_sang_${item.period}" value="${item.start_time}">
            </td>
            <td class="text-center" style="color: #64748b; font-weight: bold;">-</td>
            <td>
                <input type="time" class="bell-time-input" id="modal_end_sang_${item.period}" value="${item.end_time}">
            </td>
            <td class="text-center" id="modal_dur_sang_${item.period}"><span class="badge-tt">${dur}</span></td>
            <td class="text-center">
                <button class="btn-save-period-row" id="btnModalSave_sang_${item.period}">Lưu</button>
            </td>
        `;
        el.tbodyBellManage.appendChild(tr);

        const sInp = tr.querySelector(`#modal_start_sang_${item.period}`);
        const eInp = tr.querySelector(`#modal_end_sang_${item.period}`);
        const durSpan = tr.querySelector(`#modal_dur_sang_${item.period}`);
        const updateDur = () => {
            durSpan.innerHTML = `<span class="badge-tt">${calcDuration(sInp.value, eInp.value)}</span>`;
            updateRecessSummary();
        };
        sInp.addEventListener('input', updateDur);
        eInp.addEventListener('input', updateDur);

        tr.querySelector(`#btnModalSave_sang_${item.period}`).onclick = () => saveSinglePeriodFromModal('sang', item.period);

        if (isTarget) targetInputToFocus = sInp;
    });

    // LUNCH BREAK
    const m_t5 = morning.find(s => s.period === 5);
    const a_t1 = afternoon.find(s => s.period === 1);
    const lunchRow = document.createElement('tr');
    lunchRow.className = 'bell-recess-row';
    lunchRow.style.background = '#f1f5f9';
    const lStart = m_t5 ? m_t5.end_time : '11:20';
    const lEnd = a_t1 ? a_t1.start_time : '13:15';
    lunchRow.innerHTML = `
        <td colspan="6" style="padding: 8px 10px !important;">
            <span style="color: #0f2438; font-weight: 700;">NGHỈ TRƯA:</span> 
            <strong>${lStart} - ${lEnd}</strong> (${calcDuration(lStart, lEnd)})
        </td>
    `;
    el.tbodyBellManage.appendChild(lunchRow);

    // 2. BUỔI CHIỀU HEADER
    const rowChieuHeader = document.createElement('tr');
    rowChieuHeader.className = 'bell-session-divider';
    rowChieuHeader.style.background = '#fef3c7';
    rowChieuHeader.style.color = '#92400e';
    rowChieuHeader.innerHTML = `<td colspan="6">BUỔI CHIỀU (TIẾT 1 - TIẾT 5)</td>`;
    el.tbodyBellManage.appendChild(rowChieuHeader);

    afternoon.forEach(item => {
        if (item.period === 3) {
            const t2 = afternoon.find(s => s.period === 2);
            const recessRow = document.createElement('tr');
            recessRow.className = 'bell-recess-row';
            const rStart = t2 ? t2.end_time : '14:50';
            const rEnd = item.start_time;
            const rDur = calcDuration(rStart, rEnd);
            recessRow.innerHTML = `
                <td colspan="6">
                    <span style="color: #0f2438; font-weight: 700;">RA CHƠI BUỔI CHIỀU:</span> 
                    <strong>${rStart} - ${rEnd}</strong> (${rDur})
                </td>
            `;
            el.tbodyBellManage.appendChild(recessRow);
        }

        const tr = document.createElement('tr');
        const isTarget = highlightSession === 'chieu' && highlightPeriod === item.period;
        if (isTarget) tr.classList.add('highlight-target');

        const dur = calcDuration(item.start_time, item.end_time);

        tr.innerHTML = `
            <td><strong>Tiết ${item.period} Chiều</strong></td>
            <td>
                <input type="time" class="bell-time-input" id="modal_start_chieu_${item.period}" value="${item.start_time}">
            </td>
            <td class="text-center" style="color: #64748b; font-weight: bold;">-</td>
            <td>
                <input type="time" class="bell-time-input" id="modal_end_chieu_${item.period}" value="${item.end_time}">
            </td>
            <td class="text-center" id="modal_dur_chieu_${item.period}"><span class="badge-tt">${dur}</span></td>
            <td class="text-center">
                <button class="btn-save-period-row" id="btnModalSave_chieu_${item.period}">Lưu</button>
            </td>
        `;
        el.tbodyBellManage.appendChild(tr);

        const sInp = tr.querySelector(`#modal_start_chieu_${item.period}`);
        const eInp = tr.querySelector(`#modal_end_chieu_${item.period}`);
        const durSpan = tr.querySelector(`#modal_dur_chieu_${item.period}`);
        const updateDur = () => {
            durSpan.innerHTML = `<span class="badge-tt">${calcDuration(sInp.value, eInp.value)}</span>`;
            updateRecessSummary();
        };
        sInp.addEventListener('input', updateDur);
        eInp.addEventListener('input', updateDur);

        tr.querySelector(`#btnModalSave_chieu_${item.period}`).onclick = () => saveSinglePeriodFromModal('chieu', item.period);

        if (isTarget) targetInputToFocus = sInp;
    });

    updateRecessSummary();

    if (targetInputToFocus) {
        setTimeout(() => {
            targetInputToFocus.focus();
            targetInputToFocus.select();
        }, 150);
    }
}

function updateRecessSummary() {
    if (!el.bellRecessInfo) return;
    const m1_s = document.getElementById('modal_start_sang_1')?.value || '07:00';
    const m5_e = document.getElementById('modal_end_sang_5')?.value || '11:20';
    const a1_s = document.getElementById('modal_start_chieu_1')?.value || '13:15';
    const a5_e = document.getElementById('modal_end_chieu_5')?.value || '17:35';

    const m2_e = document.getElementById('modal_end_sang_2')?.value || '08:35';
    const m3_s = document.getElementById('modal_start_sang_3')?.value || '08:55';

    const a2_e = document.getElementById('modal_end_chieu_2')?.value || '14:50';
    const a3_s = document.getElementById('modal_start_chieu_3')?.value || '15:10';

    el.bellRecessInfo.innerHTML = `
        <div class="summary-col">
            <div class="summary-col-label">BUỔI SÁNG</div>
            <div class="summary-col-time">${m1_s} – ${m5_e}</div>
            <div class="summary-col-sub">Ra chơi: <strong>${m2_e} – ${m3_s}</strong></div>
        </div>
        <div class="summary-col summary-col-center">
            <div class="summary-col-label">NGHỈ TRƯA</div>
            <div class="summary-col-time">${m5_e} – ${a1_s}</div>
            <div class="summary-col-sub">Chuyển tiếp ca chiều</div>
        </div>
        <div class="summary-col">
            <div class="summary-col-label">BUỔI CHIỀU</div>
            <div class="summary-col-time">${a1_s} – ${a5_e}</div>
            <div class="summary-col-sub">Ra chơi: <strong>${a2_e} – ${a3_s}</strong></div>
        </div>
    `;
}

async function saveSinglePeriodFromModal(session, period) {
    const sInp = document.getElementById(`modal_start_${session}_${period}`);
    const eInp = document.getElementById(`modal_end_${session}_${period}`);
    if (!sInp || !eInp) return;

    const start_time = sInp.value.trim();
    const end_time = eInp.value.trim();
    const s_name = session === 'sang' ? 'Sáng' : 'Chiều';

    if (!start_time || !end_time) {
        showToast('Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc!', 'error');
        return;
    }
    if (start_time >= end_time) {
        showToast('Giờ bắt đầu phải trước giờ kết thúc!', 'error');
        return;
    }

    try {
        const res = await fetch('/api/bell-schedule/period', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session,
                period,
                start_time,
                end_time,
                label: `Tiết ${period} ${s_name}`
            })
        });
        if (!res.ok) throw new Error('Lỗi cập nhật máy chủ');
        
        showToast(`Đã lưu Tiết ${period} ${s_name}: ${start_time} - ${end_time}`);
        await fetchBellSchedule();
        await pollRealtimeStatus();
        renderMatrixTable(state.matrix);
        renderBellManageTable(session, period);
    } catch (e) {
        showToast('Lỗi khi lưu: ' + e.message, 'error');
    }
}

async function saveAllBellSchedule() {
    const items = [];
    for (let p = 1; p <= 5; p++) {
        const s_start = document.getElementById(`modal_start_sang_${p}`)?.value.trim();
        const s_end = document.getElementById(`modal_end_sang_${p}`)?.value.trim();
        if (!s_start || !s_end) {
            showToast(`Vui lòng nhập đầy đủ giờ cho Tiết ${p} Sáng`, 'error');
            return;
        }
        if (s_start >= s_end) {
            showToast(`Tiết ${p} Sáng: Giờ bắt đầu phải trước giờ kết thúc!`, 'error');
            return;
        }
        items.push({ session: 'sang', period: p, start_time: s_start, end_time: s_end, label: `Tiết ${p} Sáng` });
    }

    for (let p = 1; p <= 5; p++) {
        const c_start = document.getElementById(`modal_start_chieu_${p}`)?.value.trim();
        const c_end = document.getElementById(`modal_end_chieu_${p}`)?.value.trim();
        if (!c_start || !c_end) {
            showToast(`Vui lòng nhập đầy đủ giờ cho Tiết ${p} Chiều`, 'error');
            return;
        }
        if (c_start >= c_end) {
            showToast(`Tiết ${p} Chiều: Giờ bắt đầu phải trước giờ kết thúc!`, 'error');
            return;
        }
        items.push({ session: 'chieu', period: p, start_time: c_start, end_time: c_end, label: `Tiết ${p} Chiều` });
    }

    try {
        const res = await fetch('/api/bell-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        if (!res.ok) throw new Error('Lỗi cập nhật máy chủ');
        
        showToast('Đã lưu thành công toàn bộ khung giờ 10 tiết!');
        el.bellScheduleModal.classList.remove('show');
        await fetchBellSchedule();
        await pollRealtimeStatus();
        renderMatrixTable(state.matrix);
    } catch (e) {
        showToast('Lỗi khi lưu khung giờ: ' + e.message, 'error');
    }
}

async function resetBellScheduleToDefault() {
    showInAppConfirm(
        'Khôi phục Giờ chuẩn',
        'Thầy cô có chắc chắn muốn khôi phục về khung giờ chuẩn mặc định của trường?\n(Sáng: 7:00 - 11:20 | Chiều: 13:15 - 17:35)',
        async () => {
            try {
                const res = await fetch('/api/bell-schedule/reset', { method: 'POST' });
                if (!res.ok) throw new Error('Lỗi máy chủ');
                
                showToast('Đã khôi phục khung giờ chuẩn mặc định thành công!');
                await fetchBellSchedule();
                await pollRealtimeStatus();
                renderMatrixTable(state.matrix);
                renderBellManageTable();
            } catch (e) {
                showToast('Lỗi khôi phục: ' + e.message, 'error');
            }
        },
        'btn-primary',
        'Khôi phục'
    );
}

// Exit & Shutdown App
async function executeShutdown() {
    try {
        el.exitConfirmModal.classList.remove('show');
        el.shutdownScreen.style.display = 'flex';
        await fetch('/api/shutdown', { method: 'POST' });
    } catch (e) {
        // Server might shut down before response finishes, which is expected
        console.log('Server is shut down.');
    }
}

// Tab Switching: Giáo Viên / Lớp Học
function switchMainTab(tabName) {
    state.activeTab = tabName;
    if (tabName === 'teacher') {
        el.btnNavTeacher.classList.add('active');
        el.btnNavClass.classList.remove('active');
        el.sectionTeacherManagement.style.display = 'block';
        el.sectionClassManagement.style.display = 'none';
        switchViewMode(state.activeView);
        fetchTeachers();
    } else {
        el.btnNavClass.classList.add('active');
        el.btnNavTeacher.classList.remove('active');
        el.sectionTeacherManagement.style.display = 'none';
        el.sectionClassManagement.style.display = 'block';
        switchViewMode(state.activeView);
        fetchClassesStatus();
    }
}

// Settings Dropdown Toggle
function toggleSettingsDropdown() {
    const isShown = el.settingsDropdownMenu.style.display === 'flex' || el.settingsDropdownMenu.style.display === 'block';
    el.settingsDropdownMenu.style.display = isShown ? 'none' : 'flex';
}

// Switch View Mode Handler (Áp dụng cho cả Giáo viên và Lớp học)
function switchViewMode(targetView) {
    state.activeView = targetView;
    el.btnViewCard.classList.remove('active');
    el.btnViewGrid.classList.remove('active');
    el.btnViewTable.classList.remove('active');

    if (state.activeTab === 'teacher') {
        el.sectionCardView.style.display = 'none';
        el.sectionGridView.style.display = 'none';
        el.sectionTableView.style.display = 'none';

        if (targetView === 'card') {
            el.btnViewCard.classList.add('active');
            el.sectionCardView.style.display = 'block';
            el.filterToolbar.style.display = 'flex';
            el.legendBar.style.display = 'flex';
            renderTeacherCards(state.teachers);
        } else if (targetView === 'grid') {
            el.btnViewGrid.classList.add('active');
            el.sectionGridView.style.display = 'block';
            el.filterToolbar.style.display = 'flex';
            el.legendBar.style.display = 'flex';
            renderTeacherGrid(state.teachers);
        } else if (targetView === 'table') {
            el.btnViewTable.classList.add('active');
            el.sectionTableView.style.display = 'block';
            el.filterToolbar.style.display = 'none';
            el.legendBar.style.display = 'none';
            fetchMatrix();
        }
    } else {
        el.sectionClassCardView.style.display = 'none';
        el.sectionClassGridView.style.display = 'none';
        el.sectionClassTableView.style.display = 'none';

        if (targetView === 'card') {
            el.btnViewCard.classList.add('active');
            el.sectionClassCardView.style.display = 'block';
            el.filterToolbarClass.style.display = 'flex';
            el.legendBarClass.style.display = 'flex';
            renderClassCards(state.classes);
        } else if (targetView === 'grid') {
            el.btnViewGrid.classList.add('active');
            el.sectionClassGridView.style.display = 'block';
            el.filterToolbarClass.style.display = 'flex';
            el.legendBarClass.style.display = 'flex';
            renderClassGrid(state.classes);
        } else if (targetView === 'table') {
            el.btnViewTable.classList.add('active');
            el.sectionClassTableView.style.display = 'block';
            el.filterToolbarClass.style.display = 'none';
            el.legendBarClass.style.display = 'none';
            fetchClassesMatrix();
        }
    }
}

// Update Active KPI Card Styling (Teacher)
function updateKpiActiveCard(statusKey) {
    el.filterCardTotal.classList.remove('active');
    el.filterCardTeaching.classList.remove('active');
    el.filterCardFree.classList.remove('active');
    el.filterCardSpecial.classList.remove('active');

    if (statusKey === 'all') el.filterCardTotal.classList.add('active');
    else if (statusKey === 'teaching') el.filterCardTeaching.classList.add('active');
    else if (statusKey === 'free') el.filterCardFree.classList.add('active');
    else if (statusKey === 'special') el.filterCardSpecial.classList.add('active');
}

// Update Active KPI Card Styling (Class)
function updateClassKpiActiveCard(statusKey) {
    el.filterCardClassTotal.classList.remove('active');
    el.filterCardClassLearning.classList.remove('active');
    el.filterCardClassFree.classList.remove('active');
    el.filterCardClassSpecial.classList.remove('active');

    if (statusKey === 'all') el.filterCardClassTotal.classList.add('active');
    else if (statusKey === 'learning') el.filterCardClassLearning.classList.add('active');
    else if (statusKey === 'free') el.filterCardClassFree.classList.add('active');
    else if (statusKey === 'special') el.filterCardClassSpecial.classList.add('active');
}

// =========================================================
// 4. CLASS MANAGEMENT LOGIC & RENDERING
// =========================================================
async function fetchClassesStatus() {
    try {
        let url = `/api/classes/status?mode=${state.mode}`;
        if (state.mode === 'custom') {
            url += `&day=${state.targetDay}&session=${state.targetSession}&period=${state.targetPeriod}`;
        }
        if (state.classSearch) url += `&search=${encodeURIComponent(state.classSearch)}`;
        if (state.classGrade && state.classGrade !== 'all') url += `&grade=${encodeURIComponent(state.classGrade)}`;
        if (state.classSubject && state.classSubject !== 'all') url += `&subject=${encodeURIComponent(state.classSubject)}`;
        if (state.classHomeroom && state.classHomeroom !== 'all') url += `&homeroom=${encodeURIComponent(state.classHomeroom)}`;
        if (state.classStatus && state.classStatus !== 'all') url += `&status=${encodeURIComponent(state.classStatus)}`;

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        state.classes = data.classes;

        const t = data.target_time;
        if (el.targetTimeLabelClass) {
            el.targetTimeLabelClass.textContent = `Đang xem: ${t.day_name} | ${t.period_label}`;
        }

        // Cập nhật 4 ô KPI Lớp học
        if (data.counts) {
            el.statClassTotal.textContent = data.counts.total;
            el.statClassLearning.textContent = data.counts.learning;
            el.statClassFree.textContent = data.counts.free;
            el.statClassSpecial.textContent = data.counts.special;
        }

        // Render view hiện tại
        if (state.activeView === 'card') {
            renderClassCards(data.classes);
        } else if (state.activeView === 'grid') {
            renderClassGrid(data.classes);
        }
    } catch (e) {
        console.error('Lỗi tải danh sách lớp học:', e);
    }
}

function renderClassCards(classes) {
    el.classesCardGrid.innerHTML = '';
    if (!classes || classes.length === 0) {
        el.emptyStateClassCards.style.display = 'block';
        return;
    }
    el.emptyStateClassCards.style.display = 'none';

    classes.forEach(c => {
        const card = document.createElement('div');
        card.className = `class-card ${c.color_border}`;

        const shiftLabel = c.shift === 'sang' ? 'Ca Sáng' : 'Ca Chiều';
        const gvcnDisplay = c.gvcn_name || c.gvcn_short || 'Chưa phân công';
        const gvcnPhoneDisplay = c.gvcn_phone ? `<a href="tel:${c.gvcn_phone}" class="phone-link" onclick="event.stopPropagation();">${c.gvcn_phone}</a>` : '<span class="text-muted">Không tìm thấy</span>';
        
        let teacherDisplay = '<span class="text-muted">Không có</span>';
        if (c.teacher_name) {
            const phonePart = c.teacher_phone ? ` (<a href="tel:${c.teacher_phone}" class="phone-link" onclick="event.stopPropagation();">${c.teacher_phone}</a>)` : '';
            teacherDisplay = `<strong>${escapeHtml(c.teacher_name)}</strong>${phonePart}`;
        }

        let subjectDisplay = '<span class="text-muted">Không có tiết</span>';
        if (c.current_subject) {
            subjectDisplay = `<strong>${escapeHtml(c.current_subject)}</strong>`;
        }

        card.innerHTML = `
            <div class="class-card-header">
                <div class="class-title-wrap">
                    <span class="class-name-title">${escapeHtml(c.name)}</span>
                    <span class="class-shift-badge">Khối ${escapeHtml(c.grade)} • ${shiftLabel}</span>
                </div>
                <span class="badge ${c.badge_color}">${escapeHtml(c.status_label)}</span>
            </div>
            <div class="class-card-body">
                <div class="class-info-row">
                    <span class="class-info-label">Môn học hiện tại:</span>
                    <span class="class-info-val">${subjectDisplay}</span>
                </div>
                <div class="class-info-row">
                    <span class="class-info-label">Giáo viên đứng lớp:</span>
                    <span class="class-info-val">${teacherDisplay}</span>
                </div>
                <div class="class-info-row">
                    <span class="class-info-label">Giáo viên chủ nhiệm:</span>
                    <span class="class-info-val"><strong>${escapeHtml(gvcnDisplay)}</strong> (${gvcnPhoneDisplay})</span>
                </div>
            </div>
            <div class="class-card-footer">
                <button class="btn btn-secondary btn-sm btn-view-schedule" data-class="${escapeHtml(c.name)}">
                    Xem TKB Lớp
                </button>
            </div>
        `;

        const btnSchedule = card.querySelector('.btn-view-schedule');
        btnSchedule.addEventListener('click', () => openClassScheduleModal(c.name));

        el.classesCardGrid.appendChild(card);
    });
}

function renderClassGrid(classes) {
    el.classesCompactGrid.innerHTML = '';
    if (!classes || classes.length === 0) {
        el.emptyStateClassGrid.style.display = 'block';
        return;
    }
    el.emptyStateClassGrid.style.display = 'none';

    classes.forEach(c => {
        const item = document.createElement('div');
        item.className = `class-compact-card ${c.color_border}`;
        item.title = `Bấm để xem Thời khóa biểu lớp ${c.name}`;

        const gvcnDisplay = c.gvcn_short || c.gvcn_name || '';
        const subjDisplay = c.current_subject || (c.status_code === 'free' ? 'Trống tiết' : c.status_label);
        const teacherDisplay = c.teacher_short || c.teacher_name || '';

        item.innerHTML = `
            <div class="class-compact-header">
                <span class="class-compact-name">${escapeHtml(c.name)}</span>
                <span class="badge ${c.badge_color}" style="font-size: 10px; padding: 1px 5px;">${escapeHtml(c.status_label.split(' - ')[0])}</span>
            </div>
            <div class="class-compact-subject">${escapeHtml(subjDisplay)}</div>
            <div class="class-compact-subtext">${teacherDisplay ? 'GV: ' + escapeHtml(teacherDisplay) : (gvcnDisplay ? 'CN: ' + escapeHtml(gvcnDisplay) : '')}</div>
        `;

        item.addEventListener('click', () => openClassScheduleModal(c.name));
        el.classesCompactGrid.appendChild(item);
    });
}

async function fetchClassesMatrix() {
    try {
        const res = await fetch('/api/classes/matrix');
        if (!res.ok) return;
        state.classMatrix = await res.json();
        renderClassMatrixTable(state.classMatrix);
    } catch (e) {
        console.error('Lỗi tải ma trận lớp:', e);
    }
}

function renderClassMatrixTable(matrixData) {
    if (!matrixData || !matrixData.grid) return;
    const grid = matrixData.grid;
    const tbody = el.classMatrixTableBody;
    tbody.innerHTML = '';

    const curStatus = state.statusInfo ? state.statusInfo.period_info : null;
    const curDay = curStatus ? curStatus.day_of_week : null;
    const curSession = curStatus ? curStatus.session : null;
    const curPeriod = curStatus ? curStatus.period : null;
    const isSchoolTime = curStatus ? curStatus.is_school_time : false;

    // 1. BUỔI SÁNG
    for (let p = 1; p <= 5; p++) {
        if (p === 3) {
            const t2 = (state.bellSchedule || []).find(s => s.session === 'sang' && s.period === 2);
            const t3 = (state.bellSchedule || []).find(s => s.session === 'sang' && s.period === 3);
            const rStart = t2 ? t2.end_time : '08:35';
            const rEnd = t3 ? t3.start_time : '08:55';
            const recessRow = document.createElement('tr');
            recessRow.className = 'recess-row';
            recessRow.innerHTML = `<td colspan="9">RA CHƠI BUỔI SÁNG (${rStart} - ${rEnd})</td>`;
            tbody.appendChild(recessRow);
        }

        const tr = document.createElement('tr');
        if (p === 1) {
            const tdSession = document.createElement('td');
            tdSession.rowSpan = 6;
            tdSession.className = 'matrix-session-header';
            tdSession.innerHTML = '<strong>BUỔI SÁNG</strong>';
            tr.appendChild(tdSession);
        }

        const tdPeriod = document.createElement('td');
        tdPeriod.className = 'matrix-period-cell editable-period-cell';
        tdPeriod.textContent = `Tiết ${p}`;
        tdPeriod.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Sáng`;

        const tdTime = document.createElement('td');
        tdTime.className = 'matrix-time-cell editable-time-cell';
        tdTime.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Sáng`;
        renderTimeCellContent(tdTime, 'sang', p);

        tdPeriod.addEventListener('click', (e) => {
            e.stopPropagation();
            startInlineTimeEdit(tdTime, 'sang', p);
        });

        tr.appendChild(tdPeriod);
        tr.appendChild(tdTime);

        for (let d = 2; d <= 7; d++) {
            const tdData = document.createElement('td');
            tdData.className = 'matrix-data-cell';
            const cellStats = grid[d]?.sang?.[p] || { learning: 0, free: matrixData.total_classes, special: 0, salute: 0 };

            if (isSchoolTime && curDay === d && curSession === 'sang' && curPeriod === p) {
                tdData.classList.add('active-now');
            }

            let specialBadge = '';
            if (cellStats.salute > 0) {
                specialBadge = `<div class="cell-pill-special">Chào cờ (${cellStats.salute})</div>`;
            } else if (cellStats.special > 0) {
                specialBadge = `<div class="cell-pill-special">Sinh hoạt (${cellStats.special})</div>`;
            }

            tdData.innerHTML = `
                <div class="matrix-cell-content">
                    <div class="cell-pill-teaching">
                        <span>Đang học:</span>
                        <strong>${cellStats.learning} lớp</strong>
                    </div>
                    <div class="cell-pill-free">
                        <span>Trống tiết:</span>
                        <strong>${cellStats.free} lớp</strong>
                    </div>
                    ${specialBadge}
                </div>
            `;

            tdData.addEventListener('click', () => {
                openClassCellDetailModal(d, 'sang', p);
            });

            tr.appendChild(tdData);
        }

        tbody.appendChild(tr);
    }

    // NGHỈ TRƯA
    const m5 = (state.bellSchedule || []).find(s => s.session === 'sang' && s.period === 5);
    const a1 = (state.bellSchedule || []).find(s => s.session === 'chieu' && s.period === 1);
    const lStart = m5 ? m5.end_time : '11:20';
    const lEnd = a1 ? a1.start_time : '13:15';
    const lunchRow = document.createElement('tr');
    lunchRow.className = 'recess-row';
    lunchRow.style.background = '#e2e8f0';
    lunchRow.innerHTML = `<td colspan="9" style="font-weight: 800; color: #0f2438; padding: 8px;">NGHỈ TRƯA (${lStart} - ${lEnd})</td>`;
    tbody.appendChild(lunchRow);

    // 2. BUỔI CHIỀU
    for (let p = 1; p <= 5; p++) {
        if (p === 3) {
            const t2 = (state.bellSchedule || []).find(s => s.session === 'chieu' && s.period === 2);
            const t3 = (state.bellSchedule || []).find(s => s.session === 'chieu' && s.period === 3);
            const rStart = t2 ? t2.end_time : '14:50';
            const rEnd = t3 ? t3.start_time : '15:10';
            const recessRow = document.createElement('tr');
            recessRow.className = 'recess-row';
            recessRow.innerHTML = `<td colspan="9">RA CHƠI BUỔI CHIỀU (${rStart} - ${rEnd})</td>`;
            tbody.appendChild(recessRow);
        }

        const tr = document.createElement('tr');
        if (p === 1) {
            const tdSession = document.createElement('td');
            tdSession.rowSpan = 6;
            tdSession.className = 'matrix-session-header';
            tdSession.style.background = '#fef3c7';
            tdSession.style.color = '#92400e';
            tdSession.innerHTML = '<strong>BUỔI CHIỀU</strong>';
            tr.appendChild(tdSession);
        }

        const tdPeriod = document.createElement('td');
        tdPeriod.className = 'matrix-period-cell editable-period-cell';
        tdPeriod.textContent = `Tiết ${p}`;
        tdPeriod.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Chiều`;

        const tdTime = document.createElement('td');
        tdTime.className = 'matrix-time-cell editable-time-cell';
        tdTime.title = `Bấm để chỉnh sửa khung giờ Tiết ${p} Chiều`;
        renderTimeCellContent(tdTime, 'chieu', p);

        tdPeriod.addEventListener('click', (e) => {
            e.stopPropagation();
            startInlineTimeEdit(tdTime, 'chieu', p);
        });

        tr.appendChild(tdPeriod);
        tr.appendChild(tdTime);

        for (let d = 2; d <= 7; d++) {
            const tdData = document.createElement('td');
            tdData.className = 'matrix-data-cell';
            const cellStats = grid[d]?.chieu?.[p] || { learning: 0, free: matrixData.total_classes, special: 0, salute: 0 };

            if (isSchoolTime && curDay === d && curSession === 'chieu' && curPeriod === p) {
                tdData.classList.add('active-now');
            }

            let specialBadge = '';
            if (cellStats.salute > 0) {
                specialBadge = `<div class="cell-pill-special">Chào cờ (${cellStats.salute})</div>`;
            } else if (cellStats.special > 0) {
                specialBadge = `<div class="cell-pill-special">Sinh hoạt (${cellStats.special})</div>`;
            }

            tdData.innerHTML = `
                <div class="matrix-cell-content">
                    <div class="cell-pill-teaching">
                        <span>Đang học:</span>
                        <strong>${cellStats.learning} lớp</strong>
                    </div>
                    <div class="cell-pill-free">
                        <span>Trống tiết:</span>
                        <strong>${cellStats.free} lớp</strong>
                    </div>
                    ${specialBadge}
                </div>
            `;

            tdData.addEventListener('click', () => {
                openClassCellDetailModal(d, 'chieu', p);
            });

            tr.appendChild(tdData);
        }

        tbody.appendChild(tr);
    }
}

async function openClassScheduleModal(className) {
    try {
        const res = await fetch(`/api/class/${encodeURIComponent(className)}/schedule`);
        if (!res.ok) throw new Error('Không tải được lịch học của lớp');
        const data = await res.json();
        const info = data.class_info;
        const sched = data.schedule;

        el.classModalTitle.textContent = `THỜI KHÓA BIỂU LỚP ${info.name}`;
        el.cModalName.textContent = info.name;
        el.cModalGrade.textContent = `Khối ${info.grade}`;
        el.cModalShift.textContent = info.shift === 'sang' ? 'Buổi Sáng' : 'Buổi Chiều';
        el.cModalGVCN.textContent = info.gvcn_name || info.gvcn_short || 'Chưa phân công';
        el.cModalGVCNPhone.textContent = info.gvcn_phone || 'Không tìm thấy';
        el.cModalTotalPeriods.textContent = `${data.total_periods} tiết/tuần`;

        el.tbodyClassSchedule.innerHTML = '';

        function makeSchedRow(sessKey, pNum, sessLabel, rowSpan) {
            const tr = document.createElement('tr');
            if (rowSpan) {
                const tdS = document.createElement('td');
                tdS.rowSpan = rowSpan;
                tdS.className = 'matrix-session-header';
                if (sessKey === 'chieu') {
                    tdS.style.background = '#fef3c7';
                    tdS.style.color = '#92400e';
                }
                tdS.innerHTML = `<strong>${sessLabel}</strong>`;
                tr.appendChild(tdS);
            }

            const tdP = document.createElement('td');
            tdP.className = 'matrix-period-cell';
            const b = (state.bellSchedule || []).find(s => s.session === sessKey && s.period === pNum);
            const timeTxt = b ? `<br><small style="color:#64748b;font-weight:600;font-size:11px;">${b.start_time} - ${b.end_time}</small>` : '';
            tdP.innerHTML = `Tiết ${pNum}${timeTxt}`;
            tr.appendChild(tdP);

            for (let d = 2; d <= 7; d++) {
                const td = document.createElement('td');
                td.className = 'schedule-cell';
                const cell = sched[d]?.[sessKey]?.[pNum];
                if (cell && cell.subject) {
                    const phoneInfo = cell.teacher_phone ? `<div style="font-size:11px;color:#0284c7;margin-top:2px;">ĐT: ${escapeHtml(cell.teacher_phone)}</div>` : '';
                    td.innerHTML = `
                        <div style="font-weight:700;color:var(--primary-navy);font-size:12.5px;">${escapeHtml(cell.subject)}</div>
                        <div style="font-size:11.5px;color:#334155;font-weight:600;margin-top:2px;">GV: ${escapeHtml(cell.teacher_name || cell.teacher_short)}</div>
                        ${phoneInfo}
                    `;
                    td.style.background = '#f0fdf4';
                    td.style.border = '1px solid #bbf7d0';
                    td.style.borderRadius = '4px';
                    td.style.padding = '6px';
                } else if (cell && cell.cell_text) {
                    td.innerHTML = `<span style="font-weight:700;color:#d97706;background:#fef3c7;padding:3px 6px;border-radius:4px;display:inline-block;">${escapeHtml(cell.cell_text)}</span>`;
                    td.style.padding = '6px';
                } else {
                    td.innerHTML = `<span style="color:#94a3b8;font-weight:bold;">-</span>`;
                    td.style.padding = '6px';
                }
                tr.appendChild(td);
            }
            return tr;
        }

        // Buổi Sáng: 5 tiết + ra chơi
        for (let p = 1; p <= 5; p++) {
            if (p === 3) {
                const t2 = (state.bellSchedule || []).find(s => s.session === 'sang' && s.period === 2);
                const t3 = (state.bellSchedule || []).find(s => s.session === 'sang' && s.period === 3);
                const rStart = t2 ? t2.end_time : '08:35';
                const rEnd = t3 ? t3.start_time : '08:55';
                const recessRow = document.createElement('tr');
                recessRow.className = 'recess-row';
                recessRow.innerHTML = `<td colspan="8">RA CHƠI BUỔI SÁNG (${rStart} - ${rEnd})</td>`;
                el.tbodyClassSchedule.appendChild(recessRow);
            }
            el.tbodyClassSchedule.appendChild(makeSchedRow('sang', p, 'BUỔI SÁNG', p === 1 ? 6 : 0));
        }

        // Nghỉ trưa
        const m5 = (state.bellSchedule || []).find(s => s.session === 'sang' && s.period === 5);
        const a1 = (state.bellSchedule || []).find(s => s.session === 'chieu' && s.period === 1);
        const lStart = m5 ? m5.end_time : '11:20';
        const lEnd = a1 ? a1.start_time : '13:15';
        const lunchRow = document.createElement('tr');
        lunchRow.className = 'recess-row';
        lunchRow.style.background = '#e2e8f0';
        lunchRow.innerHTML = `<td colspan="8" style="font-weight:800;color:#0f2438;padding:6px;">NGHỈ TRƯA (${lStart} - ${lEnd})</td>`;
        el.tbodyClassSchedule.appendChild(lunchRow);

        // Buổi Chiều: 5 tiết + ra chơi
        for (let p = 1; p <= 5; p++) {
            if (p === 3) {
                const t2 = (state.bellSchedule || []).find(s => s.session === 'chieu' && s.period === 2);
                const t3 = (state.bellSchedule || []).find(s => s.session === 'chieu' && s.period === 3);
                const rStart = t2 ? t2.end_time : '14:50';
                const rEnd = t3 ? t3.start_time : '15:10';
                const recessRow = document.createElement('tr');
                recessRow.className = 'recess-row';
                recessRow.innerHTML = `<td colspan="8">RA CHƠI BUỔI CHIỀU (${rStart} - ${rEnd})</td>`;
                el.tbodyClassSchedule.appendChild(recessRow);
            }
            el.tbodyClassSchedule.appendChild(makeSchedRow('chieu', p, 'BUỔI CHIỀU', p === 1 ? 6 : 0));
        }

        el.classScheduleModal.classList.add('show');
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

async function openClassCellDetailModal(day, session, period) {
    try {
        const res = await fetch(`/api/classes/matrix/cell?day=${day}&session=${session}&period=${period}`);
        if (!res.ok) throw new Error('Không tải được chi tiết ô tiết học');
        const data = await res.json();
        state.lastClassCellDetail = data;

        const dayNames = { 2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu', 7: 'Thứ Bảy' };
        const sessNames = { 'sang': 'Buổi Sáng', 'chieu': 'Buổi Chiều' };
        const b = (state.bellSchedule || []).find(s => s.session === session && s.period === period);
        const timeTxt = b ? ` (${b.start_time} - ${b.end_time})` : '';

        el.classCellDetailTitle.textContent = `${dayNames[day]} | Tiết ${period} ${sessNames[session]}${timeTxt}`;
        el.classCellDetailSubtitle.textContent = `Tổng cộng: ${data.counts.total} lớp | Đang học: ${data.counts.learning} | Trống tiết: ${data.counts.free} | Hoạt động khác: ${data.counts.special + data.counts.salute}`;

        el.countClassModalLearning.textContent = data.counts.learning;
        el.countClassModalFree.textContent = data.counts.free;
        el.countClassModalSpecial.textContent = data.counts.special + data.counts.salute;

        // Render Learning
        el.tbodyClassLearning.innerHTML = '';
        data.learning.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const shiftName = item.shift === 'sang' ? 'Sáng' : 'Chiều';
            const phoneVal = item.teacher_phone ? `<a href="tel:${item.teacher_phone}" class="phone-link">${item.teacher_phone}</a>` : '<span class="text-muted">Không tìm thấy</span>';
            const gvcnPhoneVal = item.gvcn_phone ? ` (<a href="tel:${item.gvcn_phone}" class="phone-link">${item.gvcn_phone}</a>)` : '';
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>Khối ${escapeHtml(item.grade)}</td>
                <td>${shiftName}</td>
                <td><span class="badge badge-green">${escapeHtml(item.subject)}</span></td>
                <td><strong>${escapeHtml(item.teacher_name)}</strong></td>
                <td>${phoneVal}</td>
                <td>${escapeHtml(item.gvcn_name || item.gvcn_short || 'Chưa phân công')}${gvcnPhoneVal}</td>
            `;
            el.tbodyClassLearning.appendChild(tr);
        });

        // Render Free
        el.tbodyClassFree.innerHTML = '';
        data.free.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const shiftName = item.shift === 'sang' ? 'Sáng' : 'Chiều';
            const gvcnPhoneVal = item.gvcn_phone ? `<a href="tel:${item.gvcn_phone}" class="phone-link">${item.gvcn_phone}</a>` : '<span class="text-muted">Không tìm thấy</span>';
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>Khối ${escapeHtml(item.grade)}</td>
                <td>${shiftName}</td>
                <td><strong>${escapeHtml(item.gvcn_name || item.gvcn_short || 'Chưa phân công')}</strong></td>
                <td>${gvcnPhoneVal}</td>
                <td><span class="badge badge-slate">Trống tiết / Đang nghỉ</span></td>
            `;
            el.tbodyClassFree.appendChild(tr);
        });

        // Render Special
        el.tbodyClassSpecial.innerHTML = '';
        const specials = [...data.special, ...data.salute];
        specials.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const gvcnPhoneVal = item.gvcn_phone ? `<a href="tel:${item.gvcn_phone}" class="phone-link">${item.gvcn_phone}</a>` : '<span class="text-muted">Không tìm thấy</span>';
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>Khối ${escapeHtml(item.grade)}</td>
                <td><span class="badge badge-orange">${escapeHtml(item.cell_text || item.subject || 'Hoạt động')}</span></td>
                <td><strong>${escapeHtml(item.gvcn_name || item.gvcn_short || 'Chưa phân công')}</strong></td>
                <td>${gvcnPhoneVal}</td>
            `;
            el.tbodyClassSpecial.appendChild(tr);
        });

        switchClassCellTab('learning');
        el.classCellDetailModal.classList.add('show');
    } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
    }
}

function switchClassCellTab(tabName) {
    el.tabClassLearning.classList.remove('active');
    el.tabClassFree.classList.remove('active');
    el.tabClassSpecialModal.classList.remove('active');
    el.paneClassLearning.classList.remove('active');
    el.paneClassFree.classList.remove('active');
    el.paneClassSpecial.classList.remove('active');

    if (tabName === 'learning') {
        el.tabClassLearning.classList.add('active');
        el.paneClassLearning.classList.add('active');
    } else if (tabName === 'free') {
        el.tabClassFree.classList.add('active');
        el.paneClassFree.classList.add('active');
    } else if (tabName === 'special') {
        el.tabClassSpecialModal.classList.add('active');
        el.paneClassSpecial.classList.add('active');
    }
}

async function fetchHomeroomTeachers() {
    try {
        const res = await fetch('/api/homeroom-teachers');
        if (!res.ok) return;
        const gvList = await res.json();
        if (!el.filterClassHomeroom) return;

        el.filterClassHomeroom.innerHTML = '<option value="all">Tất cả GVCN</option>';
        gvList.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.full_name;
            const ph = g.phone ? ` - ${g.phone}` : '';
            opt.textContent = `${g.homeroom_class}: ${g.full_name}${ph}`;
            el.filterClassHomeroom.appendChild(opt);
        });
    } catch (e) {
        console.error('Lỗi tải GVCN:', e);
    }
}

async function fetchClassSubjects() {
    try {
        const res = await fetch('/api/class-subjects');
        if (!res.ok) return;
        const subjs = await res.json();
        if (!el.filterClassSubject) return;

        el.filterClassSubject.innerHTML = '<option value="all">Tất cả các môn</option>';
        subjs.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            el.filterClassSubject.appendChild(opt);
        });
    } catch (e) {
        console.error('Lỗi tải môn học lớp:', e);
    }
}

async function populateClassSelectForSchedule() {
    try {
        const res = await fetch('/api/classes');
        if (!res.ok) return;
        const classes = await res.json();
        if (!el.selectClassForSchedule) return;

        el.selectClassForSchedule.innerHTML = '<option value="">-- Chọn lớp xem TKB --</option>';
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = `Lớp ${c.name}`;
            el.selectClassForSchedule.appendChild(opt);
        });
    } catch (e) {
        console.error('Lỗi nạp danh sách lớp chọn TKB:', e);
    }
}

function copyClassFreeListToClipboard() {
    if (!state.lastClassCellDetail || !state.lastClassCellDetail.free) return;
    const lines = state.lastClassCellDetail.free.map((c, i) => `${i + 1}. Lớp ${c.name} (Khối ${c.grade}) - GVCN: ${c.gvcn_name || c.gvcn_short || 'Chưa có'} (${c.gvcn_phone || 'Không tìm thấy'})`);
    const txt = `DANH SÁCH LỚP TRỐNG TIẾT:\n` + lines.join('\n');
    navigator.clipboard.writeText(txt).then(() => {
        showToast('Đã sao chép danh sách lớp trống tiết vào bộ nhớ tạm!');
    }).catch(() => {
        showToast('Lỗi khi sao chép', 'error');
    });
}

function resetClassFilters() {
    el.searchClassInput.value = '';
    state.classSearch = '';
    el.btnClearSearchClass.style.display = 'none';
    el.filterClassGrade.value = 'all';
    state.classGrade = 'all';
    el.filterClassSubject.value = 'all';
    state.classSubject = 'all';
    el.filterClassHomeroom.value = 'all';
    state.classHomeroom = 'all';
    el.filterClassStatus.value = 'all';
    state.classStatus = 'all';
    updateClassKpiActiveCard('all');
    fetchClassesStatus();
}

// =========================================================
// 5. EVENT LISTENERS
// =========================================================
function setupEventListeners() {
    // Tab Navigation: Giáo Viên / Lớp Học
    el.btnNavTeacher.addEventListener('click', () => switchMainTab('teacher'));
    el.btnNavClass.addEventListener('click', () => switchMainTab('class'));

    // Cài Đặt Dropdown
    el.btnSettingsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettingsDropdown();
    });

    // Mode toggling
    el.modeRealtime.addEventListener('change', () => {
        state.mode = 'realtime';
        el.customTimePickers.style.display = 'none';
        if (state.activeTab === 'teacher') fetchTeachers();
        else fetchClassesStatus();
    });

    el.modeCustom.addEventListener('change', () => {
        state.mode = 'custom';
        el.customTimePickers.style.display = 'flex';
        state.targetDay = parseInt(el.selectDay.value);
        state.targetSession = el.selectSession.value;
        state.targetPeriod = parseInt(el.selectPeriod.value);
        if (state.activeTab === 'teacher') fetchTeachers();
        else fetchClassesStatus();
    });

    el.btnApplyCustomTime.addEventListener('click', () => {
        state.targetDay = parseInt(el.selectDay.value);
        state.targetSession = el.selectSession.value;
        state.targetPeriod = parseInt(el.selectPeriod.value);
        if (state.activeTab === 'teacher') fetchTeachers();
        else fetchClassesStatus();
    });

    // 3 View Switchers: Dạng Thẻ, Dạng Lưới, Dạng Bảng
    el.btnViewCard.addEventListener('click', () => switchViewMode('card'));
    el.btnViewGrid.addEventListener('click', () => switchViewMode('grid'));
    el.btnViewTable.addEventListener('click', () => switchViewMode('table'));

    el.btnRefreshTable.addEventListener('click', fetchMatrix);
    el.btnRefreshClassTable.addEventListener('click', fetchClassesMatrix);

    // Teacher Search Box
    let searchTimeout;
    el.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const val = e.target.value.trim();
        state.search = val;
        el.btnClearSearch.style.display = val ? 'block' : 'none';
        searchTimeout = setTimeout(fetchTeachers, 250);
    });

    el.btnClearSearch.addEventListener('click', () => {
        el.searchInput.value = '';
        state.search = '';
        el.btnClearSearch.style.display = 'none';
        fetchTeachers();
    });

    // Teacher Filters
    el.filterSubject.addEventListener('change', (e) => {
        state.subject = e.target.value;
        fetchTeachers();
    });

    if (el.filterClass) {
        el.filterClass.addEventListener('change', (e) => {
            state.class_name = e.target.value;
            fetchTeachers();
        });
    }

    el.filterStatus.addEventListener('change', (e) => {
        state.status = e.target.value;
        updateKpiActiveCard(state.status);
        fetchTeachers();
    });

    function resetFilters() {
        el.searchInput.value = '';
        state.search = '';
        el.btnClearSearch.style.display = 'none';
        el.filterSubject.value = 'all';
        state.subject = 'all';
        if (el.filterClass) el.filterClass.value = 'all';
        state.class_name = 'all';
        el.filterStatus.value = 'all';
        state.status = 'all';
        updateKpiActiveCard('all');
        fetchTeachers();
    }

    el.btnResetFiltersCards.addEventListener('click', resetFilters);
    el.btnResetFiltersGrid.addEventListener('click', resetFilters);

    // 4 KPI Card Click Filtering (Teacher)
    el.filterCardTotal.addEventListener('click', () => {
        el.filterStatus.value = 'all';
        state.status = 'all';
        updateKpiActiveCard('all');
        if (state.activeView === 'table') switchViewMode('card');
        fetchTeachers();
    });

    el.filterCardTeaching.addEventListener('click', () => {
        el.filterStatus.value = 'teaching';
        state.status = 'teaching';
        updateKpiActiveCard('teaching');
        if (state.activeView === 'table') switchViewMode('card');
        fetchTeachers();
    });

    el.filterCardFree.addEventListener('click', () => {
        el.filterStatus.value = 'free';
        state.status = 'free';
        updateKpiActiveCard('free');
        if (state.activeView === 'table') switchViewMode('card');
        fetchTeachers();
    });

    el.filterCardSpecial.addEventListener('click', () => {
        el.filterStatus.value = 'special';
        state.status = 'special';
        updateKpiActiveCard('special');
        if (state.activeView === 'table') switchViewMode('card');
        fetchTeachers();
    });

    // Class Search Box
    let classSearchTimeout;
    el.searchClassInput.addEventListener('input', (e) => {
        clearTimeout(classSearchTimeout);
        const val = e.target.value.trim();
        state.classSearch = val;
        el.btnClearSearchClass.style.display = val ? 'block' : 'none';
        classSearchTimeout = setTimeout(fetchClassesStatus, 250);
    });

    el.btnClearSearchClass.addEventListener('click', () => {
        el.searchClassInput.value = '';
        state.classSearch = '';
        el.btnClearSearchClass.style.display = 'none';
        fetchClassesStatus();
    });

    // Class Filters
    el.filterClassGrade.addEventListener('change', (e) => {
        state.classGrade = e.target.value;
        fetchClassesStatus();
    });

    el.filterClassSubject.addEventListener('change', (e) => {
        state.classSubject = e.target.value;
        fetchClassesStatus();
    });

    el.filterClassHomeroom.addEventListener('change', (e) => {
        state.classHomeroom = e.target.value;
        fetchClassesStatus();
    });

    el.filterClassStatus.addEventListener('change', (e) => {
        state.classStatus = e.target.value;
        updateClassKpiActiveCard(state.classStatus);
        fetchClassesStatus();
    });

    el.btnResetFiltersClassCards.addEventListener('click', resetClassFilters);
    el.btnResetFiltersClassGrid.addEventListener('click', resetClassFilters);

    // 4 KPI Card Click Filtering (Class)
    el.filterCardClassTotal.addEventListener('click', () => {
        el.filterClassStatus.value = 'all';
        state.classStatus = 'all';
        updateClassKpiActiveCard('all');
        if (state.activeView === 'table') switchViewMode('card');
        fetchClassesStatus();
    });

    el.filterCardClassLearning.addEventListener('click', () => {
        el.filterClassStatus.value = 'learning';
        state.classStatus = 'learning';
        updateClassKpiActiveCard('learning');
        if (state.activeView === 'table') switchViewMode('card');
        fetchClassesStatus();
    });

    el.filterCardClassFree.addEventListener('click', () => {
        el.filterClassStatus.value = 'free';
        state.classStatus = 'free';
        updateClassKpiActiveCard('free');
        if (state.activeView === 'table') switchViewMode('card');
        fetchClassesStatus();
    });

    el.filterCardClassSpecial.addEventListener('click', () => {
        el.filterClassStatus.value = 'special';
        state.classStatus = 'special';
        updateClassKpiActiveCard('special');
        if (state.activeView === 'table') switchViewMode('card');
        fetchClassesStatus();
    });

    // Class Table Select Single Class Timetable
    el.selectClassForSchedule.addEventListener('change', (e) => {
        if (e.target.value) {
            openClassScheduleModal(e.target.value);
            e.target.value = '';
        }
    });

    // Cell Detail Modal (Teacher)
    el.tabTeaching.addEventListener('click', () => switchCellTab('teaching'));
    el.tabFree.addEventListener('click', () => switchCellTab('free'));
    el.tabSpecialModal.addEventListener('click', () => switchCellTab('special'));
    el.btnCloseCellModal.addEventListener('click', () => el.cellDetailModal.classList.remove('show'));
    el.btnDismissCellModal.addEventListener('click', () => el.cellDetailModal.classList.remove('show'));
    el.btnCopyFreeList.addEventListener('click', copyFreeTeachersToClipboard);

    // Teacher Schedule Modal
    el.btnCloseTeacherModal.addEventListener('click', () => el.teacherScheduleModal.classList.remove('show'));
    el.btnDismissTeacherModal.addEventListener('click', () => el.teacherScheduleModal.classList.remove('show'));

    // Class Schedule Modal
    el.btnCloseClassModal.addEventListener('click', () => el.classScheduleModal.classList.remove('show'));
    el.btnDismissClassModal.addEventListener('click', () => el.classScheduleModal.classList.remove('show'));

    // Class Cell Detail Modal
    el.tabClassLearning.addEventListener('click', () => switchClassCellTab('learning'));
    el.tabClassFree.addEventListener('click', () => switchClassCellTab('free'));
    el.tabClassSpecialModal.addEventListener('click', () => switchClassCellTab('special'));
    el.btnCloseClassCellModal.addEventListener('click', () => el.classCellDetailModal.classList.remove('show'));
    el.btnDismissClassCellModal.addEventListener('click', () => el.classCellDetailModal.classList.remove('show'));
    el.btnCopyClassFreeList.addEventListener('click', copyClassFreeListToClipboard);

    // Upload Modal
    el.btnOpenUploadModal.addEventListener('click', () => {
        el.settingsDropdownMenu.style.display = 'none';
        el.uploadModal.classList.add('show');
        el.uploadStatus.style.display = 'none';
    });
    el.btnCloseUploadModal.addEventListener('click', () => el.uploadModal.classList.remove('show'));
    el.btnDismissUploadModal.addEventListener('click', () => el.uploadModal.classList.remove('show'));
    el.btnBrowseFile.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', (e) => handleFileSelected(e.target.files[0]));

    el.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.dropzone.classList.add('dragover');
    });
    el.dropzone.addEventListener('dragleave', () => el.dropzone.classList.remove('dragover'));
    el.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        el.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelected(e.dataTransfer.files[0]);
        }
    });
    el.btnSubmitUpload.addEventListener('click', submitUploadFile);

    // Guide Modal
    el.btnOpenGuideModal.addEventListener('click', () => {
        el.settingsDropdownMenu.style.display = 'none';
        el.guideModal.classList.add('show');
    });
    el.btnCloseGuideModal.addEventListener('click', () => {
        el.guideModal.classList.remove('show');
    });
    el.btnDismissGuideModal.addEventListener('click', () => {
        el.guideModal.classList.remove('show');
    });

    // Bell Schedule Modal
    if (el.btnOpenBellModal) el.btnOpenBellModal.addEventListener('click', () => {
        el.settingsDropdownMenu.style.display = 'none';
        openBellScheduleModal();
    });
    if (el.btnEditBellSchedule) el.btnEditBellSchedule.addEventListener('click', () => openBellScheduleModal());
    if (el.btnEditBellScheduleClass) el.btnEditBellScheduleClass.addEventListener('click', () => openBellScheduleModal());
    if (el.btnCloseBellModal) el.btnCloseBellModal.addEventListener('click', () => el.bellScheduleModal.classList.remove('show'));
    if (el.btnDismissBellModal) el.btnDismissBellModal.addEventListener('click', () => el.bellScheduleModal.classList.remove('show'));
    if (el.btnSaveAllBellSchedule) el.btnSaveAllBellSchedule.addEventListener('click', saveAllBellSchedule);
    if (el.btnResetBellSchedule) el.btnResetBellSchedule.addEventListener('click', resetBellScheduleToDefault);

    // Exit / Shutdown Confirmation
    el.btnTriggerExit.addEventListener('click', () => {
        el.settingsDropdownMenu.style.display = 'none';
        el.exitConfirmModal.classList.add('show');
    });
    el.btnCloseExitModal.addEventListener('click', () => {
        el.exitConfirmModal.classList.remove('show');
    });
    el.btnCancelExit.addEventListener('click', () => {
        el.exitConfirmModal.classList.remove('show');
    });
    el.btnConfirmExit.addEventListener('click', executeShutdown);

    // In-app Confirm Modal
    if (el.btnCloseAppConfirm) el.btnCloseAppConfirm.addEventListener('click', closeInAppConfirm);
    if (el.btnCancelAppConfirm) el.btnCancelAppConfirm.addEventListener('click', closeInAppConfirm);
    if (el.btnOkAppConfirm) el.btnOkAppConfirm.addEventListener('click', () => {
        const cb = activeConfirmCallback;
        closeInAppConfirm();
        if (typeof cb === 'function') cb();
    });

    // Close on backdrop or outside click
    window.addEventListener('click', (e) => {
        if (el.settingsDropdownWrapper && !el.settingsDropdownWrapper.contains(e.target)) {
            el.settingsDropdownMenu.style.display = 'none';
        }
        if (e.target === el.appConfirmModal) closeInAppConfirm();
        if (e.target === el.cellDetailModal) el.cellDetailModal.classList.remove('show');
        if (e.target === el.teacherScheduleModal) el.teacherScheduleModal.classList.remove('show');
        if (e.target === el.classScheduleModal) el.classScheduleModal.classList.remove('show');
        if (e.target === el.classCellDetailModal) el.classCellDetailModal.classList.remove('show');
        if (e.target === el.uploadModal) el.uploadModal.classList.remove('show');
        if (e.target === el.bellScheduleModal) el.bellScheduleModal.classList.remove('show');
        if (e.target === el.guideModal) el.guideModal.classList.remove('show');
        if (e.target === el.exitConfirmModal) el.exitConfirmModal.classList.remove('show');
    });

    // Auth & Logout Listeners
    if (el.btnDemoLogin) el.btnDemoLogin.addEventListener('click', handleDemoLogin);
    if (el.btnLogout) el.btnLogout.addEventListener('click', handleLogout);
    if (el.btnMenuLogout) el.btnMenuLogout.addEventListener('click', () => {
        el.settingsDropdownMenu.style.display = 'none';
        handleLogout();
    });
}

document.addEventListener('DOMContentLoaded', checkAuthAndInit);
