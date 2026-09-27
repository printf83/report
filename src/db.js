class SecureIndexedDB {
	constructor(dbName = "report", storeName = "data") {
		this.dbName = dbName;
		this.storeName = storeName;
		this.keyStoreName = "key"; // Dedicated store for the non-extractable key
		this.keyAlias = "encryption_key";
		this.db = null;
		this.key = null;
	}

	// 1. Initialize IndexedDB & Generate/Retrieve AES-GCM Encryption Key
	async init() {
		if (this.db && this.key) return;

		// Initialize IndexedDB first so we have access to object stores
		await new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, 1);

			request.onupgradeneeded = (e) => {
				const db = e.target.result;

				// Primary data store
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
				// Key store for non-extractable CryptoKey instance
				if (!db.objectStoreNames.contains(this.keyStoreName)) {
					db.createObjectStore(this.keyStoreName);
				}
			};

			request.onsuccess = (e) => {
				this.db = e.target.result;
				resolve(this.db);
			};

			request.onerror = (e) =>
				reject(`IndexedDB Error: ${e.target.error}`);
		});

		// Get or generate the non-extractable master key directly from IndexedDB
		this.key = await this._getOrCreateKey();
	}

	// Helper: Store/retrieve non-extractable CryptoKey using Option 1
	async _getOrCreateKey() {
		// 1. Check if non-extractable CryptoKey exists in key store
		const existingKey = await new Promise((resolve) => {
			const tx = this.db.transaction(this.keyStoreName, "readonly");
			const store = tx.objectStore(this.keyStoreName);
			const request = store.get(this.keyAlias);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => resolve(null);
		});

		if (existingKey) {
			return existingKey; // Directly returns usable CryptoKey instance
		}

		// 2. Generate a NEW NON-EXTRACTABLE 256-bit AES-GCM Key
		// Setting extractable = false prevents scripts/XSS from calling exportKey()
		const newKey = await crypto.subtle.generateKey(
			{ name: "AES-GCM", length: 256 },
			false, // extractable = false
			["encrypt", "decrypt"],
		);

		// 3. Store raw CryptoKey object into IndexedDB key store
		await new Promise((resolve, reject) => {
			const tx = this.db.transaction(this.keyStoreName, "readwrite");
			const store = tx.objectStore(this.keyStoreName);
			const request = store.put(newKey, this.keyAlias);
			request.onsuccess = () => resolve();
			request.onerror = (e) => reject(e.target.error);
		});

		return newKey;
	}

	// 2. Encrypt & Save Object to IndexedDB
	async set(key, data) {
		await this.init();

		const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
		const encodedData = new TextEncoder().encode(JSON.stringify(data));

		// Perform AES-GCM Encryption
		const encryptedContent = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv },
			this.key,
			encodedData,
		);

		const payload = {
			iv: Array.from(iv), // Store IV alongside ciphertext
			cipherText: Array.from(new Uint8Array(encryptedContent)),
		};

		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(this.storeName, "readwrite");
			const store = tx.objectStore(this.storeName);
			const request = store.put(payload, key);

			request.onsuccess = () => resolve(true);
			request.onerror = (e) => reject(e.target.error);
		});
	}

	// 3. Retrieve & Decrypt Object from IndexedDB
	async get(key) {
		await this.init();

		const payload = await new Promise((resolve, reject) => {
			const tx = this.db.transaction(this.storeName, "readonly");
			const store = tx.objectStore(this.storeName);
			const request = store.get(key);

			request.onsuccess = () => resolve(request.result);
			request.onerror = (e) => reject(e.target.error);
		});

		if (!payload) return null;

		try {
			const iv = new Uint8Array(payload.iv);
			const cipherText = new Uint8Array(payload.cipherText);

			// Perform AES-GCM Decryption
			const decryptedBuffer = await crypto.subtle.decrypt(
				{ name: "AES-GCM", iv: iv },
				this.key,
				cipherText,
			);

			const jsonString = new TextDecoder().decode(decryptedBuffer);
			return JSON.parse(jsonString);
		} catch (err) {
			console.error(
				"Decryption failed. Data modified or invalid key.",
				err,
			);
			return null;
		}
	}

	// 4. Delete item
	async delete(key) {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(this.storeName, "readwrite");
			const store = tx.objectStore(this.storeName);
			const request = store.delete(key);

			request.onsuccess = () => resolve(true);
			request.onerror = (e) => reject(e.target.error);
		});
	}
}

export const db = new SecureIndexedDB();
