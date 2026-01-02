import React, { useEffect, useState } from 'react';
import { getDatabase, ItemDocType } from './db';

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
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Grocerun Local</h1>
      
      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          className="border p-2 flex-1 rounded"
          placeholder="Add item..."
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </form>

      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-2 p-2 border rounded bg-white shadow-sm">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item)}
              className="w-5 h-5"
            />
            <span className={item.checked ? 'line-through text-gray-400' : ''}>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
