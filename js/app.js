import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

class Xitique {
  constructor() {
    this.users = new Map();
    this.init();
  }

  init() {
    this.userForm = document.getElementById('userForm');
    this.savingsForm = document.getElementById('savingsForm');
    this.userNameInput = document.getElementById('userName');
    this.userSelect = document.getElementById('userSelect');
    this.amountInput = document.getElementById('amount');
    this.savingDateInput = document.getElementById('savingDate');
    this.totalAmountDisplay = document.getElementById('totalAmount');
    this.savingsList = document.getElementById('savingsList');

    this.setupEventListeners();
    this.loadFromFirebase();
  }

  setupEventListeners() {
    this.userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addUser(this.userNameInput.value);
      this.userForm.reset();
    });

    this.savingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userName = this.userSelect.value;
      const amount = parseFloat(this.amountInput.value);
      const date = this.savingDateInput.value;
      await this.addSavings(userName, amount, date);
      this.savingsForm.reset();
    });
  }

  async addUser(name) {
    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('name', '==', name));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('Usuário já existe!');
        return;
      }

      await addDoc(userRef, {
        name: name,
        totalSavings: 0,
        createdAt: new Date()
      });

      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error adding user:", error);
      alert('Erro ao adicionar usuário');
    }
  }

  async addSavings(userName, amount, date) {
    try {
      const savingsRef = collection(db, 'savings');
      await addDoc(savingsRef, {
        userName: userName,
        amount: amount,
        date: date,
        createdAt: new Date()
      });

      const userRef = collection(db, 'users');
      const q = query(userRef, where('name', '==', userName));
      const querySnapshot = await getDocs(q);
      
      const userDoc = querySnapshot.docs[0];
      const currentAmount = userDoc.data().totalSavings || 0;
      
      await updateDoc(doc(db, 'users', userDoc.id), {
        totalSavings: currentAmount + amount
      });

      await this.loadFromFirebase();
    } catch (error) {
      console.error("Error adding savings:", error);
      alert('Erro ao adicionar poupança');
    }
  }

  async loadFromFirebase() {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      this.users.clear();
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        this.users.set(userData.name, userData.totalSavings);
      });

      this.updateUserSelect();
      this.updateDisplay();
    } catch (error) {
      console.error("Error loading data:", error);
      alert('Erro ao carregar dados');
    }
  }

  updateUserSelect() {
    this.userSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    for (const userName of this.users.keys()) {
      const option = document.createElement('option');
      option.value = userName;
      option.textContent = userName;
      this.userSelect.appendChild(option);
    }
  }

  updateDisplay() {
    const total = Array.from(this.users.values()).reduce((sum, amount) => sum + amount, 0);
    this.totalAmountDisplay.textContent = `MT ${total.toFixed(2)}`;

    this.savingsList.innerHTML = '';
    for (const [name, amount] of this.users) {
      const item = document.createElement('div');
      item.className = 'savings-item';
      item.innerHTML = `
        <span class="name">${name}</span>
        <span class="amount">MT ${amount.toFixed(2)}</span>
      `;
      this.savingsList.appendChild(item);
    }
  }
}

// Initialize the application
const app = new Xitique();