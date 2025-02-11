import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

class Xitique {
  constructor() {
    this.users = new Map();
    this.auth = getAuth();
    this.isAdmin = false;
    this.init();
  }

  init() {
    this.loginForm = document.getElementById('loginForm');
    this.userForm = document.getElementById('userForm');
    this.savingsForm = document.getElementById('savingsForm');
    this.userNameInput = document.getElementById('userName');
    this.userSelect = document.getElementById('userSelect');
    this.amountInput = document.getElementById('amount');
    this.savingDateInput = document.getElementById('savingDate');
    this.totalAmountDisplay = document.getElementById('totalAmount');
    this.savingsList = document.getElementById('savingsList');
    this.adminSection = document.getElementById('adminSection');

    this.setupEventListeners();
    this.setupAuthListener();
  }

  setupAuthListener() {
    onAuthStateChanged(this.auth, (user) => {
      if (user && user.email === 'camilo.duvane@example.com') {
        this.isAdmin = true;
        this.adminSection.style.display = 'block';
        this.loadFromFirebase();
      } else {
        this.isAdmin = false;
        this.adminSection.style.display = 'none';
      }
      document.getElementById('loginSection').style.display = user ? 'none' : 'block';
      document.getElementById('mainContent').style.display = user ? 'block' : 'none';
    });
  }

  setupEventListeners() {
    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await signInWithEmailAndPassword(this.auth, email, password);
      } catch (error) {
        alert('Erro no login: ' + error.message);
      }
    });

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

  async addInitialUsers() {
    const initialUsers = [
      'João Silva',
      'Maria Santos',
      'Pedro Alves',
      'Ana Costa',
      'Carlos Mendes',
      'Sofia Oliveira',
      'Ricardo Pereira',
      'Lucia Fernandes',
      'Miguel Santos',
      'Isabel Lima'
    ];

    for (const name of initialUsers) {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('name', '==', name));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(userRef, {
          name: name,
          totalSavings: 0,
          createdAt: new Date()
        });
      }
    }
  }

  async deleteUser(userName) {
    if (!this.isAdmin) {
      alert('Apenas o administrador pode deletar usuários');
      return;
    }

    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('name', '==', userName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, 'users', querySnapshot.docs[0].id));
        await this.loadFromFirebase();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert('Erro ao deletar usuário');
    }
  }

  async editUser(oldName, newName) {
    if (!this.isAdmin) {
      alert('Apenas o administrador pode editar usuários');
      return;
    }

    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('name', '==', oldName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        await updateDoc(doc(db, 'users', querySnapshot.docs[0].id), {
          name: newName
        });
        await this.loadFromFirebase();
      }
    } catch (error) {
      console.error("Error editing user:", error);
      alert('Erro ao editar usuário');
    }
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
      
      const adminControls = this.isAdmin ? `
        <div class="admin-controls">
          <button onclick="app.editUser('${name}', prompt('Novo nome:'))">Editar</button>
          <button onclick="app.deleteUser('${name}')">Deletar</button>
        </div>
      ` : '';

      item.innerHTML = `
        <span class="name">${name}</span>
        <span class="amount">MT ${amount.toFixed(2)}</span>
        ${adminControls}
      `;
      this.savingsList.appendChild(item);
    }
  }
}

// Initialize the application
const app = new Xitique();
window.app = app; // Make it accessible globally for the admin controls

// Add initial users when the app starts
app.addInitialUsers();