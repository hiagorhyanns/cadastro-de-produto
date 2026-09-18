import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  uploadBytesResumable,
  StorageError
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const storage = getStorage(app);
console.log("Firebase initialized. Storage bucket:", firebaseConfig.storageBucket);

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function uploadImage(file: File | string, path: string): Promise<string> {
  try {
    let fileToUpload: File | Blob;
    let originalName = path;
    let size = 0;
    let type = 'image/png';

    if (typeof file === 'string' && file.startsWith('data:')) {
      const res = await fetch(file);
      fileToUpload = await res.blob();
      size = fileToUpload.size;
      type = fileToUpload.type;
    } else if (file instanceof File) {
      fileToUpload = file;
      originalName = file.name;
      size = file.size;
      type = file.type;
    } else {
      throw new Error('Invalid file format');
    }

    const fileExt = originalName.split('.').pop() || 'png';
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log(`Starting upload to Storage: ${filePath} (${size} bytes, ${type})`);
    const storageRef = ref(storage, filePath);
    
    // Using uploadBytesResumable for better feedback and potential resilience
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        }, 
        (error) => {
          console.error("Storage upload error details:", error);
          if ((error as StorageError).code === 'storage/retry-limit-exceeded') {
            console.error("Firebase Storage Retry Limit Exceeded. Check if storage is provisioned and if CORS is configured.");
          }
          reject(error);
        }, 
        () => {
          resolve();
        }
      );
    });

    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`ITEM 3 - Upload successful. downloadURL: ${downloadUrl}`);

    // Save metadata to Firestore
    const uploadId = uuidv4();
    const metadata: UploadData = {
      id: uploadId,
      url: downloadUrl,
      name: originalName,
      type: type,
      size: size,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, UPLOADS_COLLECTION, uploadId), metadata);

    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
}

// Uploads Types and Services
export interface UploadData {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

const UPLOADS_COLLECTION = 'uploads';

export async function getUploads(): Promise<UploadData[]> {
  try {
    const q = query(collection(db, UPLOADS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UploadData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, UPLOADS_COLLECTION);
    return [];
  }
}

export async function deleteUpload(upload: UploadData) {
  try {
    // Note: We might want to also delete from Storage, but for now let's just delete metadata
    // since we don't have an easy way to delete from storage without the path.
    // In a real app we'd store the storage path too.
    await deleteDoc(doc(db, UPLOADS_COLLECTION, upload.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, UPLOADS_COLLECTION);
  }
}

// Prompt Types and Services
export interface PromptData {
  id?: string;
  nome: string;
  tipo: string;
  conteudo: string;
  imagem_antes?: string | null;
  imagem_depois?: string | null;
  imagem_link?: string | null;
  drive_link?: string | null;
  criado_em: string;
  submenu?: string | null;
  ordem?: number | null;
}

const PROMPTS_COLLECTION = 'prompts';

export async function getPrompts(): Promise<PromptData[]> {
  try {
    const q = query(collection(db, PROMPTS_COLLECTION), orderBy('criado_em', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PROMPTS_COLLECTION);
    return [];
  }
}

// UUID Helper for environments where crypto.randomUUID might be unavailable
function uuidv4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function savePrompt(prompt: PromptData) {
  const path = PROMPTS_COLLECTION;
  try {
    const id = prompt.id || uuidv4();
    const cleanData = { ...prompt, id };
    await setDoc(doc(db, PROMPTS_COLLECTION, id), cleanData);
    return cleanData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePrompt(id: string) {
  if (!id) {
    console.error('deletePrompt called without an ID');
    return;
  }
  const path = `${PROMPTS_COLLECTION}/${id}`;
  try {
    console.log(`Firebase: Attempting to delete document at ${path}`);
    await deleteDoc(doc(db, PROMPTS_COLLECTION, id));
    console.log(`Firebase: Successfully deleted document at ${path}`);
  } catch (error) {
    console.error(`Firebase: Error deleting document at ${path}`, error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Tool Types and Services
export interface ToolData {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  icon: string | null;
  createdAt: number;
}

const TOOLS_COLLECTION = 'tools';

export async function getTools(): Promise<ToolData[]> {
  try {
    const q = query(collection(db, TOOLS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToolData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TOOLS_COLLECTION);
    return [];
  }
}

export async function saveTool(tool: ToolData) {
  const path = TOOLS_COLLECTION;
  try {
    console.log("ITEM 1/6 - SALVANDO NO FIRESTORE:", tool);
    await setDoc(doc(db, TOOLS_COLLECTION, tool.id), tool);
    return tool;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTool(id: string) {
  const path = `${TOOLS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TOOLS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// SEO Types and Services
export interface SEOData {
  id: string;
  text: string;
  type: string;
  status: 'feito' | 'progresso' | 'validar';
  createdAt: number;
}

const SEO_COLLECTION = 'seo_items';

export async function getSEOItems(): Promise<SEOData[]> {
  try {
    const q = query(collection(db, SEO_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SEOData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SEO_COLLECTION);
    return [];
  }
}

export async function saveSEOItem(item: SEOData) {
  const path = SEO_COLLECTION;
  try {
    const id = item.id || uuidv4();
    const dataToSave = { ...item, id };
    await setDoc(doc(db, SEO_COLLECTION, id), dataToSave);
    return dataToSave;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSEOItem(id: string) {
  const path = `${SEO_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, SEO_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Training Types and Services
export interface Improvement {
  version: string;
  detail: string;
}

export interface TrainingStepData {
  id: string;
  imageUrl?: string;
  name: string;
  explanation: string;
  position: number;
  createdAt: number;
  improvements?: Improvement[];
}

const TRAINING_COLLECTION = 'training_steps';

export async function getTrainingSteps(): Promise<TrainingStepData[]> {
  try {
    // We'll sort by position in memory or via query
    const q = query(collection(db, TRAINING_COLLECTION), orderBy('position', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingStepData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TRAINING_COLLECTION);
    return [];
  }
}

export async function saveTrainingStep(step: TrainingStepData) {
  const path = TRAINING_COLLECTION;
  try {
    const id = step.id || uuidv4();
    const dataToSave = { ...step, id };
    await setDoc(doc(db, TRAINING_COLLECTION, id), dataToSave);
    return dataToSave;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTrainingStep(id: string) {
  const path = `${TRAINING_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TRAINING_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Access Types and Services
export interface AccessData {
  id: string;
  toolName: string;
  hasAccess: boolean;
  createdAt: number;
}

const ACCESSES_COLLECTION = 'accesses';

export async function getAccesses(): Promise<AccessData[]> {
  try {
    const q = query(collection(db, ACCESSES_COLLECTION), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ACCESSES_COLLECTION);
    return [];
  }
}

export async function saveAccess(access: AccessData) {
  const path = ACCESSES_COLLECTION;
  try {
    const id = access.id || uuidv4();
    const dataToSave = { ...access, id };
    await setDoc(doc(db, ACCESSES_COLLECTION, id), dataToSave);
    return dataToSave;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAccess(id: string) {
  const path = `${ACCESSES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, ACCESSES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Monitoring Types and Services
export interface DailyRecord {
  id: string;
  date: string;
  quantity: number;
  note: string;
  createdAt: number;
}

const MONITOR_COLLECTION = 'monitor_records';

export async function getMonitorRecords(): Promise<DailyRecord[]> {
  try {
    const q = query(collection(db, MONITOR_COLLECTION), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MONITOR_COLLECTION);
    return [];
  }
}

export async function saveMonitorRecord(record: DailyRecord) {
  const path = MONITOR_COLLECTION;
  try {
    const id = record.id || uuidv4();
    const dataToSave = { ...record, id };
    await setDoc(doc(db, MONITOR_COLLECTION, id), dataToSave);
    return dataToSave;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMonitorRecord(id: string) {
  const path = `${MONITOR_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, MONITOR_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Productivity Types and Services
export interface ProductivityData {
  id: string;
  title: string;
  description: string;
  note: string;
  icon?: string;
  completed?: boolean;
  createdAt: number;
}

const PRODUCTIVITY_COLLECTION = 'productivity_improvements';

export async function getProductivityItems(): Promise<ProductivityData[]> {
  try {
    const q = query(collection(db, PRODUCTIVITY_COLLECTION), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductivityData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTIVITY_COLLECTION);
    return [];
  }
}

export async function saveProductivityItem(item: ProductivityData) {
  const path = PRODUCTIVITY_COLLECTION;
  try {
    const id = item.id || uuidv4();
    const dataToSave = { ...item, id };
    await setDoc(doc(db, PRODUCTIVITY_COLLECTION, id), dataToSave);
    return dataToSave;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductivityItem(id: string) {
  const path = `${PRODUCTIVITY_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PRODUCTIVITY_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// System Info Types and Services
export interface SystemInfoData {
  id: string;
  title: string;
  explanation: string;
  content: string;
  lastUpdated: number;
}

const SYSTEMS_INFO_COLLECTION = 'systems_info';

export async function getSystemInfo(id: string): Promise<SystemInfoData | null> {
  try {
    const docRef = doc(db, SYSTEMS_INFO_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SystemInfoData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SYSTEMS_INFO_COLLECTION}/${id}`);
    return null;
  }
}

export async function saveSystemInfo(info: SystemInfoData) {
  const path = SYSTEMS_INFO_COLLECTION;
  try {
    await setDoc(doc(db, SYSTEMS_INFO_COLLECTION, info.id), info);
    return info;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Ebook Types and Services
export interface EbookData {
  id?: string;
  coverUrl: string;
  title: string;
  description: string;
  downloadUrl: string;
  tags: string[];
  createdAt: number;
}

const EBOOKS_COLLECTION = 'ebooks';

export async function getEbooks(): Promise<EbookData[]> {
  try {
    const q = query(collection(db, EBOOKS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as EbookData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, EBOOKS_COLLECTION);
    return [];
  }
}

export async function saveEbook(ebook: EbookData): Promise<EbookData> {
  const path = EBOOKS_COLLECTION;
  try {
    const id = ebook.id || uuidv4();
    const cleanData = { ...ebook, id };
    await setDoc(doc(db, EBOOKS_COLLECTION, id), cleanData);
    return cleanData as EbookData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteEbook(id: string): Promise<void> {
  if (!id) {
    console.error('deleteEbook called without an ID');
    return;
  }
  const path = `${EBOOKS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, EBOOKS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Product Rules Types and Services
export interface ProductRuleData {
  id: string;
  imageUrl?: string;
  name: string;
  requiredInfo: string;
  forbiddenInfo: string;
  createdAt: number;
}

const PRODUCT_RULES_COLLECTION = 'product_rules';

export async function getProductRules(): Promise<ProductRuleData[]> {
  try {
    const q = query(collection(db, PRODUCT_RULES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProductRuleData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCT_RULES_COLLECTION);
    return [];
  }
}

export async function saveProductRule(rule: ProductRuleData): Promise<ProductRuleData> {
  const path = PRODUCT_RULES_COLLECTION;
  try {
    await setDoc(doc(db, PRODUCT_RULES_COLLECTION, rule.id), rule);
    return rule;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteProductRule(id: string): Promise<void> {
  if (!id) {
    console.error('deleteProductRule called without an ID');
    return;
  }
  const path = `${PRODUCT_RULES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PRODUCT_RULES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

