import React, { useState } from 'react';

const Switch: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => {
    return (
        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" disabled={disabled} />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    );
};

interface ImpostazioniViewProps {
    theme: string;
    onThemeChange: (theme: string) => void;
    language: 'it' | 'en';
    onLanguageChange: (language: 'it' | 'en') => void;
    pointerVisibility: 'all' | 'tackled';
    onPointerVisibilityChange: (visibility: 'all' | 'tackled') => void;
    isGlobalTutorEnabled: boolean;
    userName: string;
    degreeCourse: string;
    isTutorContextualAnalysisEnabled: boolean;
    onUpdateTutorSettings: (settings: { enabled?: boolean; name?: string; degreeCourse?: string; contextualAnalysisEnabled?: boolean }) => void;
    onResetTutorChat: () => void;
    t: (key: string) => string;
}

export const ImpostazioniView: React.FC<ImpostazioniViewProps> = ({ theme, onThemeChange, language, onLanguageChange, pointerVisibility, onPointerVisibilityChange, isGlobalTutorEnabled, userName, degreeCourse, isTutorContextualAnalysisEnabled, onUpdateTutorSettings, onResetTutorChat, t }) => {
    const [activeTab, setActiveTab] = useState<'appearance' | 'logic' | 'tutor'>('tutor');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const handleThemeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        onThemeChange(e.target.checked ? 'light' : 'dark');
    };

    const handleConfirmReset = () => {
        onResetTutorChat();
        setIsResetConfirmOpen(false);
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('settings.title')}</h1>
                <p className="text-gray-400 mt-2 text-md">{t('settings.description')}</p>
            </header>

            <div className="bg-gray-800 rounded-2xl p-6">
                <div className="mb-6 border-b border-gray-700">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                                activeTab === 'appearance'
                                    ? 'bg-gray-900/50 text-white border-b-2 border-indigo-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t('settings.appearance')}
                        </button>
                        <button
                            onClick={() => setActiveTab('logic')}
                            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                                activeTab === 'logic'
                                    ? 'bg-gray-900/50 text-white border-b-2 border-indigo-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t('settings.appLogic')}
                        </button>
                        <button
                            onClick={() => setActiveTab('tutor')}
                            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                                activeTab === 'tutor'
                                    ? 'bg-gray-900/50 text-white border-b-2 border-indigo-500'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t('settings.tutor')}
                        </button>
                    </div>
                </div>

                {activeTab === 'appearance' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                            <div>
                                <h3 className="font-semibold text-white">{t('settings.lightTheme')}</h3>
                                <p className="text-sm text-gray-400">{t('settings.lightThemeDescription')}</p>
                            </div>
                            <Switch
                                checked={theme === 'light'}
                                onChange={handleThemeToggle}
                            />
                        </div>

                        <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                            <div>
                                <h3 className="font-semibold text-white">{t('settings.language')}</h3>
                                <p className="text-sm text-gray-400">{t('settings.languageDescription')}</p>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => onLanguageChange(e.target.value as 'it' | 'en')}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                                aria-label={t('settings.language')}
                            >
                                <option value="it">{t('settings.italian')}</option>
                                <option value="en">{t('settings.english')}</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'logic' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                            <div>
                                <h3 className="font-semibold text-white">{t('settings.pointerVisibility')}</h3>
                                <p className="text-sm text-gray-400">{t('settings.pointerVisibilityDescription')}</p>
                            </div>
                            <select
                                value={pointerVisibility}
                                onChange={(e) => onPointerVisibilityChange(e.target.value as 'all' | 'tackled')}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                                aria-label={t('settings.pointerVisibility')}
                            >
                                <option value="tackled">{t('settings.tackledPointersOnly')}</option>
                                <option value="all">{t('settings.allPointers')}</option>
                            </select>
                        </div>
                    </div>
                )}
                
                {activeTab === 'tutor' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                            <div>
                                <h3 className="font-semibold text-white">{t('settings.enableTutor')}</h3>
                                <p className="text-sm text-gray-400">{t('settings.enableTutorDescription')}</p>
                            </div>
                            <Switch
                                checked={isGlobalTutorEnabled}
                                onChange={(e) => onUpdateTutorSettings({ enabled: e.target.checked })}
                            />
                        </div>
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                             <div>
                                <h3 className={`font-semibold transition-colors ${!isGlobalTutorEnabled ? 'text-gray-500' : 'text-white'}`}>{t('settings.userName')}</h3>
                                <p className={`text-sm text-gray-400 mb-2 transition-colors ${!isGlobalTutorEnabled ? 'text-gray-600' : 'text-gray-400'}`}>{t('settings.userNameDescription')}</p>
                            </div>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => onUpdateTutorSettings({ name: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isGlobalTutorEnabled}
                                aria-label={t('settings.userName')}
                            />
                        </div>
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                             <div>
                                <h3 className={`font-semibold transition-colors ${!isGlobalTutorEnabled ? 'text-gray-500' : 'text-white'}`}>{t('settings.degreeCourse')}</h3>
                                <p className={`text-sm text-gray-400 mb-2 transition-colors ${!isGlobalTutorEnabled ? 'text-gray-600' : 'text-gray-400'}`}>{t('settings.degreeCourseDescription')}</p>
                            </div>
                            <input
                                type="text"
                                value={degreeCourse}
                                onChange={(e) => onUpdateTutorSettings({ degreeCourse: e.target.value })}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isGlobalTutorEnabled}
                                aria-label={t('settings.degreeCourse')}
                            />
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg">
                            <div>
                                <h3 className={`font-semibold transition-colors ${!isGlobalTutorEnabled ? 'text-gray-500' : 'text-white'}`}>{t('settings.contextualAnalysis')}</h3>
                                <p className={`text-sm transition-colors ${!isGlobalTutorEnabled ? 'text-gray-600' : 'text-gray-400'}`}>{t('settings.contextualAnalysisDescription')}</p>
                            </div>
                            <Switch
                                checked={isTutorContextualAnalysisEnabled}
                                onChange={(e) => onUpdateTutorSettings({ contextualAnalysisEnabled: e.target.checked })}
                                disabled={!isGlobalTutorEnabled}
                            />
                        </div>
                        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                            <h3 className="font-semibold text-red-300">{t('settings.tutorResetTitle')}</h3>
                            <p className="text-sm text-red-400/80 mb-3">{t('settings.tutorResetDescription')}</p>
                            <button onClick={() => setIsResetConfirmOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">{t('settings.tutorResetButton')}</button>
                        </div>
                    </div>
                )}
            </div>

            {isResetConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setIsResetConfirmOpen(false)}>
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white">{t('settings.tutorResetButton')}</h3>
                            <p className="text-gray-300 my-4">{t('settings.tutorResetConfirm')}</p>
                        </div>
                        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4 rounded-b-2xl">
                            <button onClick={() => setIsResetConfirmOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleConfirmReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">{t('common.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};