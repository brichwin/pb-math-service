
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
}

const mathJaxLock = new Mutex();
const imageConverterLock = new Mutex();
const SRELock = new Mutex();
const mathCATLock = new Mutex();

module.exports = {
  withTimeout,
  Mutex,
  mathJaxLock,
  imageConverterLock,
  SRELock,
  mathCATLock
};