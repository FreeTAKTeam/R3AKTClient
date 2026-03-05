package network.reticulum.emergency;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class ReticulumNodeServiceInstrumentedTest {
    @Test
    public void bindServiceExposesLifecycleStatus() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation()
                .getTargetContext()
                .getApplicationContext();

        AtomicReference<ReticulumNodeService> serviceRef = new AtomicReference<>();
        CountDownLatch connected = new CountDownLatch(1);
        ServiceConnection connection = new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder service) {
                if (service instanceof ReticulumNodeService.LocalBinder) {
                    ReticulumNodeService.LocalBinder binder = (ReticulumNodeService.LocalBinder) service;
                    serviceRef.set(binder.getService());
                }
                connected.countDown();
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                serviceRef.set(null);
            }
        };

        boolean didBind = context.bindService(
                new Intent(context, ReticulumNodeService.class),
                connection,
                Context.BIND_AUTO_CREATE
        );
        assertTrue(didBind);
        assertTrue(connected.await(5, TimeUnit.SECONDS));
        assertNotNull(serviceRef.get());

        String serviceStatusJson = serviceRef.get().getServiceStatusJson();
        assertTrue(serviceStatusJson.contains("\"state\""));

        context.unbindService(connection);
    }
}
