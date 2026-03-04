import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { DataSource } from './types'

class DataSourceDatabase extends Dexie {
  sources!: Table<DataSource, string>

  constructor() {
    super('opengeo-datasources')
    this.version(1).stores({
      sources: 'id, type, createdAt',
    })
  }
}

const db = new DataSourceDatabase()

export async function getAllSources(): Promise<DataSource[]> {
  return db.sources.orderBy('createdAt').toArray()
}

export async function addSource(source: DataSource): Promise<void> {
  await db.sources.put(source)
}

export async function removeSource(id: string): Promise<void> {
  await db.sources.delete(id)
}
