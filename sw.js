
self.addEventListener('notificationclick', (event) => {
  const noteId = event.notification.data.noteId;
  const action = event.action;

  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is open, send a message to it
      for (const client of clientList) {
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: action,
          noteId: noteId
        });
      }
      
      // If no clients are open and it's a snooze/done action, 
      // in a real production app we'd use IndexedDB to update state here.
      // For this implementation, we focus the window to let the app handle it.
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
