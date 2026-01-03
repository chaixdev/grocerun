import React, { useEffect, useState } from 'react';
import { getDatabase, ItemDocType } from './db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncDebug } from './components/SyncDebug';

function App() {
  const [items, setItems] = useState<ItemDocType[]>([]);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    const init = async () => {
      const db = await getDatabase();
      db.items.find().sort({ createdAt: 'desc' }).$.subscribe(items => {
        setItems(items.map(i => i.toJSON()));
      });
    };
    init();
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    const db = await getDatabase();
    await db.items.insert({
      id: crypto.randomUUID(),
      name: newItemName,
      checked: false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    setNewItemName('');
  };

  const toggleItem = async (item: ItemDocType) => {
    const db = await getDatabase();
    const doc = await db.items.findOne(item.id).exec();
    if (doc) {
        await doc.patch({
            checked: !item.checked,
            updatedAt: new Date().toISOString()
        });
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Grocerun Local</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addItem} className="flex gap-2 mb-4">
              <Input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Add item..."
              />
              <Button type="submit">Add</Button>
            </form>

            <ul className="space-y-2">
              {items.map(item => (
                <li key={item.id} className="flex items-center gap-2 p-2 border rounded bg-card text-card-foreground shadow-sm">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item)}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className={item.checked ? 'line-through text-muted-foreground' : ''}>{item.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div>
          <SyncDebug />
        </div>
      </div>
    </div>
  );
}

export default App;
