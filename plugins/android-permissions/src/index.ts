import { registerPlugin } from '@capacitor/core';

import type { AndroidPermissionsPlugin } from './definitions';

const AndroidPermissions = registerPlugin<AndroidPermissionsPlugin>('AndroidPermissions', {
    web: () => import('./web').then(m => new m.AndroidPermissionsWeb()),
});

export * from './definitions';
export { AndroidPermissions };
