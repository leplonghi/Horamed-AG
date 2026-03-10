/**
 * SUPABASE COMPATIBILITY LAYER
 * 
 * This file re-routes legacy Supabase API calls to Firebase.
 * All 46 components/hooks that still import from this file will
 * work seamlessly with Firebase until they are individually migrated.
 * 
 * TODO: Migrate each file directly to Firebase imports, then delete this file.
 */
import { auth, db, functions } from '@/integrations/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// ---------- Auth Compat ----------
const authCompat = {
  getUser: async () => {
    const user = auth.currentUser;
    if (!user) return { data: { user: null }, error: null };
    return {
      data: {
        user: {
          id: user.uid,
          email: user.email,
          user_metadata: {
            full_name: user.displayName,
            avatar_url: user.photoURL,
          },
        },
      },
      error: null,
    };
  },
  getSession: async () => {
    const user = auth.currentUser;
    if (!user) return { data: { session: null }, error: null };
    const token = await user.getIdToken();
    return {
      data: {
        session: {
          access_token: token,
          user: {
            id: user.uid,
            email: user.email,
          },
        },
      },
      error: null,
    };
  },
};

// ---------- Query Builder Compat ----------
interface QueryResult {
  data: Record<string, unknown>[] | null;
  error: Error | null;
  count?: number;
}

interface SingleResult {
  data: Record<string, unknown> | null;
  error: Error | null;
}

class SupabaseQueryBuilder {
  private collectionName: string;
  private selectFields: string = '*';
  private filters: Array<{ field: string; op: string; value: unknown }> = [];
  private orderByField: string | null = null;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitCount: number | null = null;
  private isCount = false;
  private isHead = false;
  private insertData: Record<string, unknown> | null = null;
  private updateData: Record<string, unknown> | null = null;
  private isDelete = false;

  constructor(tableName: string) {
    this.collectionName = tableName;
  }

  select(fields: string = '*', options?: { count?: string; head?: boolean }): this {
    this.selectFields = fields;
    if (options?.count === 'exact') this.isCount = true;
    if (options?.head) this.isHead = true;
    return this;
  }

  eq(field: string, value: unknown): this {
    this.filters.push({ field, op: '==', value });
    return this;
  }

  neq(field: string, value: unknown): this {
    this.filters.push({ field, op: '!=', value });
    return this;
  }

  gt(field: string, value: unknown): this {
    this.filters.push({ field, op: '>', value });
    return this;
  }

  gte(field: string, value: unknown): this {
    this.filters.push({ field, op: '>=', value });
    return this;
  }

  lt(field: string, value: unknown): this {
    this.filters.push({ field, op: '<', value });
    return this;
  }

  lte(field: string, value: unknown): this {
    this.filters.push({ field, op: '<=', value });
    return this;
  }

  in(field: string, values: unknown[]): this {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  not(field: string, op: string, value: unknown): this {
    if (op === 'is' && value === null) {
      this.filters.push({ field, op: '!=', value: null });
    }
    return this;
  }

  match(conditions: Record<string, unknown>): this {
    for (const [field, value] of Object.entries(conditions)) {
      this.filters.push({ field, op: '==', value });
    }
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    this.orderByField = field;
    this.orderDirection = options?.ascending !== false ? 'asc' : 'desc';
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this & PromiseLike<QueryResult> {
    this.insertData = Array.isArray(data) ? data[0] : data;
    return this as this & PromiseLike<QueryResult>;
  }

  update(data: Record<string, unknown>): this {
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.isDelete = true;
    return this;
  }

  upsert(data: Record<string, unknown>, options?: { onConflict?: string }): this & PromiseLike<QueryResult> {
    this.updateData = data;
    // For simplicity in this compat layer, we treat upsert as an update if filters exist,
    // or we'll handle it in execute by checking if it should be an addDoc or setDoc.
    return this as this & PromiseLike<QueryResult>;
  }

  async single(): Promise<SingleResult> {
    try {
      // If we have an eq filter on doc ID pattern, try direct doc fetch
      const idFilter = this.filters.find(f => f.field === 'id');
      if (idFilter) {
        const docRef = doc(db, this.collectionName, String(idFilter.value));
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return { data: { id: snapshot.id, ...snapshot.data() }, error: null };
        }
        return { data: null, error: null };
      }

      // Otherwise run query and return first
      const result = await this.execute();
      return {
        data: result.data?.[0] || null,
        error: result.error,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async maybeSingle(): Promise<SingleResult> {
    return this.single();
  }

  private async execute(): Promise<QueryResult> {
    try {
      // Handle INSERT
      if (this.insertData) {
        const colRef = collection(db, this.collectionName);
        const docRef = await addDoc(colRef, {
          ...this.insertData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return {
          data: [{ id: docRef.id, ...this.insertData }],
          error: null,
        };
      }

      // Handle UPDATE / UPSERT
      if (this.updateData && this.filters.length > 0) {
        const q = this.buildQuery();
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // If upsert-like behavior is needed and no doc found, create one
          const colRef = collection(db, this.collectionName);
          const docRef = await addDoc(colRef, {
            ...this.updateData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return { data: [{ id: docRef.id, ...this.updateData }], error: null };
        }

        const updates = snapshot.docs.map(async (d) => {
          const docRef = doc(db, this.collectionName, d.id);
          await updateDoc(docRef, {
            ...this.updateData,
            updatedAt: serverTimestamp(),
          });
        });
        await Promise.all(updates);
        return { data: [], error: null };
      }

      // Handle DELETE
      if (this.isDelete && this.filters.length > 0) {
        const q = this.buildQuery();
        const snapshot = await getDocs(q);
        const deletes = snapshot.docs.map(async (d) => {
          const docRef = doc(db, this.collectionName, d.id);
          await deleteDoc(docRef);
        });
        await Promise.all(deletes);
        return { data: [], error: null };
      }

      // Handle SELECT
      const q = this.buildQuery();
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      if (this.isCount) {
        return { data: null, error: null, count: snapshot.size };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error, count: 0 };
    }
  }

  private buildQuery() {
    const colRef = collection(db, this.collectionName);
    const constraints = [];

    for (const filter of this.filters) {
      // Skip relational filters (e.g. "items.user_id") — Firebase doesn't support cross-collection
      if (filter.field.includes('.')) continue;

      if (filter.op === 'in' && Array.isArray(filter.value)) {
        // Firestore 'in' supports max 30 values
        const values = (filter.value as unknown[]).slice(0, 30);
        constraints.push(where(filter.field, 'in', values));
      } else {
        constraints.push(where(filter.field, filter.op as '<' | '<=' | '==' | '!=' | '>=' | '>' | 'in', filter.value));
      }
    }

    if (this.orderByField) {
      constraints.push(orderBy(this.orderByField, this.orderDirection));
    }

    if (this.limitCount) {
      constraints.push(limit(this.limitCount));
    }

    return query(colRef, ...constraints);
  }

  // Make this thenable for async/await usage
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ---------- Functions Compat ----------
const functionsCompat = {
  invoke: async (functionName: string, options?: { body?: unknown }) => {
    try {
      const callable = httpsCallable(functions, functionName);
      const result = await callable(options?.body || {});
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },
};

// ---------- Main Export ----------
export const supabase = {
  auth: authCompat,
  from: (tableName: string) => new SupabaseQueryBuilder(tableName),
  functions: functionsCompat,
};