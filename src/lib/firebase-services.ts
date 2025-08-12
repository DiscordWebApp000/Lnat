import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from './firebase';
import { User, UserProfile, ExamResult, Permission, UserPermission } from '@/types/user';
import { SupportTicket, SupportMessage } from '@/types/user';

// Auth Services
export const authService = {
  // Register
  async register(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const newUser: User = {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName,
        role: 'user',
        permissions: [],
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        createdAt: Timestamp.fromDate(newUser.createdAt),
        lastLoginAt: Timestamp.fromDate(newUser.lastLoginAt)
      });
      
      // Create profile
      const profile: UserProfile = {
        uid: user.uid,
        firstName,
        lastName,
        email: user.email!
      };
      
      await setDoc(doc(db, 'userProfiles', user.uid), profile);
      
      return newUser;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'An error occurred during registration');
    }
  },

  // Login
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user information
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      let userWithDates: User;
      
      if (!userDoc.exists()) {
        // If user not found in Firestore, create new profile
        console.log('User not found in Firestore, creating new profile');
        
        const newUser: User = {
          uid: user.uid,
          email: user.email!,
          firstName: user.email!.split('@')[0], // Email'in @ öncesi kısmını ad olarak kullan
          lastName: '',
          role: 'user',
          permissions: [],
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true
        };
        
        // Save to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...newUser,
          createdAt: Timestamp.fromDate(newUser.createdAt),
          lastLoginAt: Timestamp.fromDate(newUser.lastLoginAt)
        });
        
        // Create profile
        const profile: UserProfile = {
          uid: user.uid,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: user.email!
        };
        
        await setDoc(doc(db, 'userProfiles', user.uid), profile);
        
        userWithDates = newUser;
      } else {
        const userData = userDoc.data();
        userWithDates = {
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
        } as User;
      }
      
              // Update last login time
        await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: Timestamp.fromDate(new Date())
      });
      
      return userWithDates;
    } catch (error: unknown) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'An error occurred during login');
    }
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Change password
  async changePassword(newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }
    await updatePassword(user, newPassword);
  },

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }
};

// User Services
export const userService = {
  // Get user information
  async getUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        console.log(`User ${uid} not found in Firestore`);
        return null;
      }
      
      const userData = userDoc.data();
      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const profileDoc = await getDoc(doc(db, 'userProfiles', uid));
    if (!profileDoc.exists()) {
      return null;
    }
    return profileDoc.data() as UserProfile;
  },

  // Profil güncelle
  async updateProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'userProfiles', uid), profile);
  },

  // Tüm kullanıcıları getir (admin için)
  async getAllUsers(): Promise<User[]> {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => doc.data() as User);
  },

  // Kullanıcı durumunu güncelle
  async updateUserStatus(uid: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { isActive });
  },

  // Kullanıcı profilini güncelle (hem users hem userProfiles)
  async updateUserProfile(uid: string, userData: Partial<User>): Promise<void> {
    try {
      // Update both users collection and userProfiles collection
      const updateData = {
        ...userData,
        lastLoginAt: Timestamp.fromDate(new Date())
      };
      
      await updateDoc(doc(db, 'users', uid), updateData);
      
      // Also update userProfiles collection
      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      };
      
      await updateDoc(doc(db, 'userProfiles', uid), profileData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Şifre güncelle
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      // Re-authenticate user before changing password
      const credential = await signInWithEmailAndPassword(auth, user.email!, currentPassword);
      await updatePassword(credential.user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
};

// Exam Results Services
export const examService = {
  // Sınav sonucu kaydet
  async saveExamResult(result: Omit<ExamResult, 'id'>): Promise<string> {
    console.log('saveExamResult called with:', result);
    try {
      const docRef = await addDoc(collection(db, 'examResults'), {
        ...result,
        examDate: Timestamp.fromDate(result.examDate)
      });
      console.log('Exam result saved successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error in saveExamResult:', error);
      throw error;
    }
  },

  // Kullanıcının sınav sonuçlarını getir
  async getUserExamResults(userId: string): Promise<ExamResult[]> {
    console.log('getUserExamResults called for userId:', userId);
    try {
      // Index gerektirmeyen basit query
      const resultsQuery = query(
        collection(db, 'examResults'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(resultsQuery);
      console.log('Found exam results:', snapshot.docs.length);
      
      // Client-side'da sıralama yap
      const results = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        examDate: doc.data().examDate.toDate()
      })) as ExamResult[];
      
      // Date'e göre sırala (en yeni önce)
      results.sort((a, b) => b.examDate.getTime() - a.examDate.getTime());
      
      console.log('Processed and sorted exam results:', results);
      return results;
    } catch (error) {
      console.error('Error in getUserExamResults:', error);
      throw error;
    }
  },

  // Tüm sınav sonuçlarını getir (admin için)
  async getAllExamResults(): Promise<ExamResult[]> {
    try {
      const resultsQuery = collection(db, 'examResults');
      const snapshot = await getDocs(resultsQuery);
      
      const results = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        examDate: doc.data().examDate.toDate()
      })) as ExamResult[];
      
      // Client-side'da sıralama yap
      results.sort((a, b) => b.examDate.getTime() - a.examDate.getTime());
      
      return results;
    } catch (error) {
      console.error('Error in getAllExamResults:', error);
      throw error;
    }
  },

  // Sınav sonucu sil
  async deleteExamResult(resultId: string): Promise<void> {
    await deleteDoc(doc(db, 'examResults', resultId));
  }
};

// Permission Services
export const permissionService = {
  // Kullanıcıya yetki ver
  async grantPermission(userId: string, permissionId: string, grantedBy: string): Promise<void> {
    const userPermission: UserPermission = {
      userId,
      permissionId,
      grantedBy,
      grantedAt: new Date(),
      isActive: true
    };
    
    await addDoc(collection(db, 'userPermissions'), userPermission);
    
    // Kullanıcının permissions array'ini güncelle
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const updatedPermissions = [...userData.permissions, permissionId];
      await updateDoc(doc(db, 'users', userId), { permissions: updatedPermissions });
    }
  },

  // Kullanıcının yetkisini kaldır
  async revokePermission(userId: string, permissionId: string): Promise<void> {
    // UserPermissions koleksiyonundan kaldır
    const permissionsQuery = query(
      collection(db, 'userPermissions'),
      where('userId', '==', userId),
      where('permissionId', '==', permissionId)
    );
    const snapshot = await getDocs(permissionsQuery);
    snapshot.docs.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    
    // Kullanıcının permissions array'ini güncelle
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const updatedPermissions = userData.permissions.filter(p => p !== permissionId);
      await updateDoc(doc(db, 'users', userId), { permissions: updatedPermissions });
    }
  },

  // Kullanıcının yetkilerini kontrol et
  async checkUserPermission(userId: string, tool: string): Promise<boolean> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data() as User;
    
    // Admin tüm yetkilere sahip
    if (userData.role === 'admin') {
      return true;
    }
    
    // Kullanıcının yetkilerini kontrol et
    const permissionsQuery = query(
      collection(db, 'userPermissions'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(permissionsQuery);
    
    for (const permissionDoc of snapshot.docs) {
      const permissionData = permissionDoc.data() as UserPermission;
      const permission = await getDoc(doc(db, 'permissions', permissionData.permissionId));
      
      if (permission.exists()) {
        const permissionInfo = permission.data() as Permission;
        if (permissionInfo.tool === tool || permissionInfo.tool === 'all') {
          return true;
        }
      }
    }
    
    return false;
  },

  // Yeni yetki oluştur
  async createPermission(permission: Omit<Permission, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'permissions'), permission);
    return docRef.id;
  },

  // Yetki sil
  async deletePermission(permissionId: string): Promise<void> {
    await deleteDoc(doc(db, 'permissions', permissionId));
  },

  // Tüm yetkileri getir
  async getAllPermissions(): Promise<Permission[]> {
    const permissionsQuery = query(collection(db, 'permissions'));
    const snapshot = await getDocs(permissionsQuery);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Permission[];
  }
}; 

// Support Services
export const supportService = {
  // Create a new support ticket
  async createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'lastMessageAt' | 'isReadByAdmin' | 'isReadByUser'>): Promise<string> {
    try {
      const ticketData = {
        ...ticket,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        lastMessageAt: Timestamp.fromDate(new Date()),
        // Ticket oluşturulduğunda admin'e bildirim gönder, user'a değil
        isReadByAdmin: false, // Admin'e bildirim
        isReadByUser: true    // User kendi ticket'ını görmüş sayılır
      };
      
      const docRef = await addDoc(collection(db, 'supportTickets'), ticketData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  },

  // Get user's support tickets
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      // Index gerektirmeyen basit query
      const q = query(
        collection(db, 'supportTickets'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      // Client-side'da sıralama yap
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      })) as SupportTicket[];
      
      // lastMessageAt'a göre sırala (en yeni önce)
      tickets.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
      
      return tickets;
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  },

  // Get all support tickets (admin)
  async getAllTickets(): Promise<SupportTicket[]> {
    try {
      // Index gerektirmeyen basit query
      const snapshot = await getDocs(collection(db, 'supportTickets'));
      
      // Client-side'da sıralama yap
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
      })) as SupportTicket[];
      
      // lastMessageAt'a göre sırala (en yeni önce)
      tickets.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
      
      return tickets;
    } catch (error) {
      console.error('Error getting all tickets:', error);
      return [];
    }
  },

  // Get ticket messages
  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
      // Index gerektirmeyen basit query
      const q = query(
        collection(db, 'supportMessages'),
        where('ticketId', '==', ticketId)
      );
      const snapshot = await getDocs(q);
      
      // Client-side'da sıralama yap
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as SupportMessage[];
      
      // createdAt'a göre sırala (eski önce)
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      return messages;
    } catch (error) {
      console.error('Error getting ticket messages:', error);
      return [];
    }
  },

  // Send a message
  async sendMessage(message: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<string> {
    try {
      const messageData = {
        ...message,
        createdAt: Timestamp.fromDate(new Date())
      };
      
      const docRef = await addDoc(collection(db, 'supportMessages'), messageData);
      
      // Update ticket's lastMessageAt and read status
      const ticketRef = doc(db, 'supportTickets', message.ticketId);
      const updateData: { 
        lastMessageAt: Timestamp;
        updatedAt: Timestamp;
        isReadByUser?: boolean;
        isReadByAdmin?: boolean;
      } = {
        lastMessageAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Sadece admin mesaj attığında user'a bildirim gönder
      if (message.senderType === 'admin') {
        updateData.isReadByUser = false; // User'a bildirim göster
        updateData.isReadByAdmin = true; // Admin kendi mesajını gördü
      } else {
        // User mesaj attığında admin'e bildirim gönder
        updateData.isReadByAdmin = false; // Admin'e bildirim göster
        // isReadByUser'ı değiştirme - user kendi mesajını görmüş sayılır
      }

      await updateDoc(ticketRef, updateData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  },

  // Update ticket status (admin)
  async updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw new Error('Failed to update ticket status');
    }
  },

  // Mark ticket as read
  async markTicketAsRead(ticketId: string, isAdmin: boolean): Promise<void> {
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      if (isAdmin) {
        await updateDoc(ticketRef, { isReadByAdmin: true });
      } else {
        await updateDoc(ticketRef, { isReadByUser: true });
      }
    } catch (error) {
      console.error('Error marking ticket as read:', error);
    }
  }
}; 