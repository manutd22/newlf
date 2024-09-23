declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          startParam?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        showPopup: (params: { title?: string; message: string; buttons: Array<{ type: string; text?: string; }> }) => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string) => Promise<boolean>;
        shareUrl: (url: string) => void;
        close: () => void;
      };
    };
  }
}

export {};