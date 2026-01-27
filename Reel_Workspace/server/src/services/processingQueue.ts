/**
 * Simple in-memory queue to prevent concurrent reel processing
 * CRITICAL for 512MB RAM limit - only process one reel at a time
 */

interface QueueItem {
  id: string;
  userId: string;
  instagramUrl: string;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

class ProcessingQueue {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private currentItem: QueueItem | null = null;

  /**
   * Add item to queue and wait for processing
   */
  async add<T>(
    userId: string,
    instagramUrl: string,
    processor: () => Promise<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `${userId}_${Date.now()}`;

      this.queue.push({
        id,
        userId,
        instagramUrl,
        resolve,
        reject,
      });

      console.log(
        `[Queue] Added to queue: ${id} (position: ${this.queue.length})`,
      );

      // Start processing if not already processing
      if (!this.processing) {
        this.processNext(processor);
      }
    });
  }

  /**
   * Process next item in queue
   */
  private async processNext<T>(processor: () => Promise<T>): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      this.currentItem = null;
      console.log(`[Queue] Queue empty, waiting for new items...`);
      return;
    }

    this.processing = true;
    this.currentItem = this.queue.shift()!;

    console.log(
      `[Queue] Processing: ${this.currentItem.id} (${this.queue.length} remaining)`,
    );

    try {
      const result = await processor();
      this.currentItem.resolve(result);
      console.log(`[Queue] ✓ Completed: ${this.currentItem.id}`);
    } catch (error) {
      this.currentItem.reject(error);
      console.log(`[Queue] ✗ Failed: ${this.currentItem.id}`);
    } finally {
      // Small delay to allow garbage collection
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Process next item
      this.processNext(processor);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      currentItem: this.currentItem
        ? {
            id: this.currentItem.id,
            userId: this.currentItem.userId,
            url: this.currentItem.instagramUrl,
          }
        : null,
    };
  }
}

// Export singleton instance
export const processingQueue = new ProcessingQueue();
