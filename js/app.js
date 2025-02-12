import { db, auth, googleProvider, signInWithEmailAndPassword, signInWithPopup } 
  from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

class Xitique {
  constructor() {
    this.users = new Map();
    this.isAdmin = false;
    this.currentUser = null;
    this.emailToUser = new Map([
      ['cintiajaime11@gmail.com', 'Cíntia Mucumbi'],
      ['camilowilliam0@gmail.com', 'Camilo Duvane'],
      ['milo@example.com', 'Administrator']
    ]);
    this.currentUsername = '';
    this.init();
  }

  init() {
    // Form elements
    this.loginForm = document.getElementById('loginForm');
    this.userForm = document.getElementById('userForm');
    this.savingsForm = document.getElementById('savingsForm');
    this.projectionForm = document.getElementById('projectionForm');

    // Input elements
    this.userNameInput = document.getElementById('userName');
    this.userSelect = document.getElementById('userSelect');
    this.amountInput = document.getElementById('amount');
    this.savingDateInput = document.getElementById('savingDate');
    this.numSaversInput = document.getElementById('numSavers');

    // Display elements
    this.totalAmountDisplay = document.getElementById('totalAmount');
    this.savingsList = document.getElementById('savingsList');
    this.adminSection = document.getElementById('adminSection');
    this.mainContent = document.getElementById('mainContent');
    this.loginSection = document.getElementById('loginSection');

    // Initialize tab navigation
    this.initTabs();
    this.setupEventListeners();
  }

  initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show selected tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
  }

  setupEventListeners() {
    // Login form handling
    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      await this.handleEmailLogin(email, password);
    });

    // Google sign-in
    document.getElementById('googleSignIn').addEventListener('click', () => {
      this.handleGoogleLogin();
    });

    // Other form submissions
    this.userForm?.addEventListener('submit', async (e) => {
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
      this.updateRecentSavings();
    });

    document.getElementById('calculateProjection').addEventListener('click', () => {
      this.calculateProjection();
    });

    this.numSaversInput.addEventListener('change', () => {
      this.updateMonthlyContributionPerPerson();
    });
  }

  async handleEmailLogin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      
      // Set isAdmin based on email or special admin credentials
      this.isAdmin = email === 'milo@example.com' || 
                     (email === 'admin@xitique.com' && password === '1234');
      
      // Set the current username based on email
      this.currentUsername = this.emailToUser.get(email) || 'Guest User';
      
      this.onLoginSuccess();
    } catch (error) {
      console.error("Login error:", error);
      alert('Erro no login: ' + error.message);
    }
  }

  async handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.currentUser = result.user;
      
      // Set isAdmin and username based on email
      const email = result.user.email;
      this.isAdmin = email === 'milo@example.com';
      this.currentUsername = this.emailToUser.get(email) || 'Guest User';
      
      this.onLoginSuccess();
    } catch (error) {
      console.error("Google login error:", error);
      alert('Erro no login com Google: ' + error.message);
    }
  }

  onLoginSuccess() {
    this.loginSection.style.display = 'none';
    this.mainContent.style.display = 'block';
    this.adminSection.style.display = this.isAdmin ? 'block' : 'none';
    this.loadFromFirebase();
    this.switchTab('register');
  }

  async updateRecentSavings() {
    const savingsRef = collection(db, 'savings');
    const q = query(savingsRef, orderBy('date', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    
    const tbody = document.querySelector('#recentSavings tbody');
    tbody.innerHTML = '';
    
    querySnapshot.forEach(doc => {
      const saving = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(saving.date).toLocaleDateString()}</td>
        <td>${saving.userName}</td>
        <td>MT ${saving.amount.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  async addInitialUsers() {
    const initialUsers = [
      'Camilo Duvane',
      'Cíntia Mucumbi',
      'João Silva',
      'Maria Santos',
      'Pedro Alves',
      'Ana Costa',
      'Carlos Mendes',
      'Sofia Oliveira',
      'Ricardo Pereira',
      'Lucia Fernandes'
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
      this.updateRecentSavings();
    } catch (error) {
      console.error("Error loading data:", error);
      alert('Erro ao carregar dados');
    }
  }

  updateUserSelect() {
    this.userSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    
    // If admin, show all users. If not, only show current user
    const users = this.isAdmin ? 
      Array.from(this.users.keys()) : 
      [this.currentUsername];
    
    for (const userName of users) {
      const option = document.createElement('option');
      option.value = userName;
      option.textContent = userName;
      
      // Auto-select current user's name if not admin
      if (!this.isAdmin && userName === this.currentUsername) {
        option.selected = true;
      }
      
      this.userSelect.appendChild(option);
    }
  }

  async updateDisplay() {
    const total = Array.from(this.users.values()).reduce((sum, amount) => sum + amount, 0);
    this.totalAmountDisplay.textContent = `MT ${total.toFixed(2)}`;

    // Update savings list with admin controls
    this.savingsList.innerHTML = '';
    
    // First add a summary table
    const summaryTable = document.createElement('table');
    summaryTable.className = 'savings-summary-table';
    summaryTable.innerHTML = `
      <thead>
        <tr>
          <th>Nome</th>
          <th>Total Individual</th>
          <th>% do Total</th>
          ${this.isAdmin ? '<th>Ações</th>' : ''}
        </tr>
      </thead>
      <tbody></tbody>
    `;

    for (const [name, amount] of this.users) {
      const percentage = (amount / total * 100).toFixed(1);
      const row = summaryTable.querySelector('tbody').insertRow();
      
      row.innerHTML = `
        <td>${name}</td>
        <td>MT ${amount.toFixed(2)}</td>
        <td>${percentage}%</td>
        ${this.isAdmin ? `
          <td>
            <button onclick="app.editUser('${name}', prompt('Novo nome:'))">Editar</button>
            <button onclick="app.deleteUser('${name}')">Deletar</button>
          </td>
        ` : ''}
      `;
    }

    this.savingsList.appendChild(summaryTable);

    // Add monthly history table
    await this.updateMonthlyHistory();
  }

  async updateMonthlyHistory() {
    const historyTable = document.createElement('div');
    historyTable.className = 'monthly-history';
    historyTable.innerHTML = '<h3>Histórico Mensal de Poupança</h3>';

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Mês</th>
          <th>Nome</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    // Get savings history from Firebase
    const savingsRef = collection(db, 'savings');
    const q = query(savingsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const tbody = table.querySelector('tbody');
    querySnapshot.forEach(doc => {
      const saving = doc.data();
      const row = tbody.insertRow();
      const date = new Date(saving.date);
      
      row.innerHTML = `
        <td>${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
        <td>${saving.userName}</td>
        <td>MT ${saving.amount.toFixed(2)}</td>
      `;
    });

    historyTable.appendChild(table);
    this.savingsList.appendChild(historyTable);
  }

  calculateProjection() {
    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
    const numSavers = parseInt(this.numSaversInput.value) || 1;
    const currentTotal = Array.from(this.users.values()).reduce((sum, amount) => sum + amount, 0);
    
    const monthsToTarget = Math.ceil((targetAmount - currentTotal) / monthlyContribution);
    const yearsToTarget = (monthsToTarget / 12).toFixed(1);
    const contributionPerPerson = monthlyContribution / numSavers;
    
    const projectionResults = document.getElementById('projectionResults');
    projectionResults.innerHTML = `
      <div class="result-item">
        <strong>Valor atual:</strong> <span class="highlight">MT ${currentTotal.toFixed(2)}</span>
      </div>
      <div class="result-item">
        <strong>Objetivo:</strong> <span class="highlight">MT ${targetAmount.toFixed(2)}</span>
      </div>
      <div class="result-item">
        <strong>Tempo estimado:</strong> <span class="highlight">${monthsToTarget} meses (${yearsToTarget} anos)</span>
      </div>
      <div class="result-item">
        <strong>Número de poupadores:</strong> <span class="highlight">${numSavers}</span>
      </div>
      <div class="result-item">
        <strong>Contribuição mensal total:</strong> <span class="highlight">MT ${monthlyContribution.toFixed(2)}</span>
      </div>
      <div class="result-item">
        <strong>Contribuição mensal por pessoa:</strong> <span class="highlight">MT ${contributionPerPerson.toFixed(2)}</span>
      </div>
    `;
  }

  updateMonthlyContributionPerPerson() {
    const totalMonthly = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const numSavers = parseInt(this.numSaversInput.value) || 1;
    const contributionPerPerson = totalMonthly / numSavers;
    
    document.getElementById('contributionPerPerson').textContent = 
      `MT ${contributionPerPerson.toFixed(2)}`;
  }
}

// Initialize the application
const app = new Xitique();
window.app = app;

// Add initial users only if they don't exist
app.addInitialUsers();