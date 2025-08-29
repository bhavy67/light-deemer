declare global {
  namespace chrome {
    namespace runtime {
      interface MessageSender {
        id?: string;
        url?: string;
        frameId?: number;
        tab?: chrome.tabs.Tab;
      }

      interface InstalledDetails {
        reason: string;
        previousVersion?: string;
        id: string;
      }

      function getURL(path: string): string;
      function sendMessage(message: any): Promise<any>;
      const onInstalled: chrome.events.Event<
        (details: InstalledDetails) => void
      >;
      const onStartup: chrome.events.Event<() => void>;
      const onMessage: chrome.events.Event<
        (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void
      >;
    }

    namespace tabs {
      interface Tab {
        id?: number;
        url?: string;
        title?: string;
        active: boolean;
        windowId: number;
      }

      function query(queryInfo: any): Promise<Tab[]>;
      function sendMessage(tabId: number, message: any): Promise<any>;
      function create(createProperties: { url: string }): Promise<Tab>;
    }

    namespace commands {
      const onCommand: chrome.events.Event<(command: string) => void>;
    }

    namespace storage {
      interface StorageArea {
        get(
          keys?: string | string[] | { [key: string]: any } | null
        ): Promise<{ [key: string]: any }>;
        set(items: { [key: string]: any }): Promise<void>;
        remove(keys: string | string[]): Promise<void>;
        clear(): Promise<void>;
        getBytesInUse(keys?: string | string[] | null): Promise<number>;
        QUOTA_BYTES: number;
      }

      const sync: StorageArea;
      const local: StorageArea;
    }

    namespace events {
      interface Event<T extends (...args: any[]) => any> {
        addListener(callback: T): void;
        removeListener(callback: T): void;
        hasListener(callback: T): boolean;
      }
    }
  }
}

export {};
