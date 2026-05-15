/**
 * Network Utilities
 * Monitor network connectivity and handle offline mode
 */

import { useAppStateStore } from "@/src/store/appStateStore";
import NetInfo, { NetInfoChangeHandler, NetInfoState, NetInfoStateType } from "@react-native-community/netinfo";

class NetworkService {
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkState(state);

      // Set up listener for network changes
      this.unsubscribe = NetInfo.addEventListener(
        this.handleNetworkChange
      );

      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing network service:", error);
    }
  }

  /**
   * Cleanup network listener
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
  }

  /**
   * Get current network state
   */
  async getNetworkState(): Promise<NetInfoState> {
    try {
      return await NetInfo.fetch();
    } catch (error) {
      console.error("Error fetching network state:", error);
      return {
        isConnected: true,
        isInternetReachable: true,
        type: NetInfoStateType.none,
        isWifiEnabled: false,
        details: null,
      } as NetInfoState;
    }
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    try {
      const state = await this.getNetworkState();
      return state.isConnected === true && state.isInternetReachable !== false;
    } catch (error) {
      return true; // Assume online on error
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange: NetInfoChangeHandler = (state) => {
    this.updateNetworkState(state);
  };

  /**
   * Update app state with network info
   */
  private updateNetworkState(state: NetInfoState): void {
    const isOnline = state.isConnected === true && state.isInternetReachable !== false;
    useAppStateStore.setState({ isOnline });

    if (!isOnline) {
      console.warn("Device is offline");
    }
  }
}

export default new NetworkService();
