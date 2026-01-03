import React, { useEffect, useState } from 'react';
import { getDatabase } from '../db';
import { UserDocType } from '../db/schema/user';
import { HouseholdDocType } from '../db/schema/household';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SyncDebug() {
  const [users, setUsers] = useState<UserDocType[]>([]);
  const [households, setHouseholds] = useState<HouseholdDocType[]>([]);

  useEffect(() => {
    const init = async () => {
      const db = await getDatabase();
      
      // Subscribe to users
      db.users.find().$.subscribe(users => {
        console.log('Users updated:', users);
        setUsers(users.map(u => u.toJSON()));
      });

      // Subscribe to households
      db.households.find().$.subscribe(households => {
        console.log('Households updated:', households);
        setHouseholds(households.map(h => h.toJSON()));
      });
    };
    init();
  }, []);

  return (
    <div className="p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground">No users synced yet...</p>
          ) : (
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.id} className="p-2 border rounded">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Name:</strong> {user.name || 'N/A'}</div>
                  <div><strong>Households:</strong> {user.householdIds?.join(', ') || 'None'}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Households ({households.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {households.length === 0 ? (
            <p className="text-muted-foreground">No households synced yet...</p>
          ) : (
            <ul className="space-y-2">
              {households.map(household => (
                <li key={household.id} className="p-2 border rounded">
                  <div><strong>Name:</strong> {household.name}</div>
                  <div><strong>Owner ID:</strong> {household.ownerId || 'N/A'}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
