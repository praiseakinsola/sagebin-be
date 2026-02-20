const SERIAL_NUMBER = '000001';
const BASE_URL = `http://localhost:8080/bins/${SERIAL_NUMBER}`;
const DURATION_MS = 5 * 60 * 1000; // 5 minutes
const PING_INTERVAL_MS = 5000; // 5 seconds
const START_TIME = Date.now();

let currentFillLevel = 50;
let currentStatus: 'open' | 'close' = 'close';

// Helper for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function updateFillLevel(fillLevel: number) {
  try {
    const response = await fetch(`${BASE_URL}/fill-level`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage: fillLevel }),
    });

    if (response.ok) {
      console.log(
        `[${new Date().toISOString()}] Fill level updated to ${fillLevel}%`,
      );
      currentFillLevel = fillLevel;
    } else {
      console.error(
        `[${new Date().toISOString()}] Failed to update fill level: ${response.status} ${response.statusText}`,
      );
      const text = await response.text();
      console.error(`Response: ${text}`);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error updating fill level:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function updateStatus(status: 'open' | 'close') {
  try {
    const response = await fetch(`${BASE_URL}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status }),
    });

    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Status updated to ${status}`);
      currentStatus = status;
    } else {
      console.error(
        `[${new Date().toISOString()}] Failed to update status: ${response.status} ${response.statusText}`,
      );
      const text = await response.text();
      console.error(`Response: ${text}`);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error updating status:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function sendPing() {
  try {
    const response = await fetch(`${BASE_URL}/online`, {
      method: 'PATCH',
    });

    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Ping sent (Heartbeat)`);
    } else {
      console.error(
        `[${new Date().toISOString()}] Failed to send ping: ${response.status} ${response.statusText}`,
      );
      const text = await response.text();
      console.error(`Response: ${text}`);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error sending ping:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function simulate() {
  console.log(
    `Starting simulation for bin ${SERIAL_NUMBER} over ${DURATION_MS / 60000} minutes...`,
  );

  while (Date.now() - START_TIME < DURATION_MS) {
    // 1. Send Ping (Heartbeat)
    await sendPing();

    // 2. Randomly decide to go OFFLINE (simulated by sleeping and skipping pings)
    // 10% chance to go offline
    if (Math.random() < 0.1) {
      const offlineDuration = Math.floor(Math.random() * 20000) + 10000; // 10-30 seconds
      console.log(
        `[${new Date().toISOString()}] Going OFFLINE for ${offlineDuration / 1000} seconds...`,
      );
      await sleep(offlineDuration);
      console.log(`[${new Date().toISOString()}] Back ONLINE`);
      // When coming back online, we continue the loop, which will ping immediately
      continue;
    }

    // 3. Randomly update fill level
    // 30% chance to change fill level
    if (Math.random() < 0.3) {
      const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
      let newFill = currentFillLevel + change;
      newFill = Math.max(0, Math.min(100, newFill)); // Clamp between 0 and 100

      if (newFill !== currentFillLevel) {
        await updateFillLevel(newFill);
      }
    }

    // 4. Randomly update status
    // 10% chance to toggle status
    if (Math.random() < 0.1) {
      const newStatus = currentStatus === 'open' ? 'close' : 'open';
      await updateStatus(newStatus);
    }

    // Wait for the next ping interval
    await sleep(PING_INTERVAL_MS);
  }

  console.log(`Simulation finished.`);
}

simulate();
