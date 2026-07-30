// setup.js
import device from 'detox';

beforeAll(async () => {
  await device.resetBackend();
  await device.launchDevice();
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await device.terminateBackend();
});
