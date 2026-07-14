// Escuchar el evento 'push' que viene desde el servidor
self.addEventListener('push', (event) => {
    let data = { title: "Nuevo mensaje", body: "Tienes una actualización." };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: "J&M Hub ✨", body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: '/nuestro-espacio/img/icon-180.png',
        badge: '/nuestro-espacio/img/icon-180.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Permitir que al hacer clic en la notificación se abra la app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/nuestro-espacio/index.html')
    );
});