import React from 'react';

const MODULES_MATRIX = [
  { name: 'Customer 360 (CDP)', sysadmin: 'Full', admin: 'Full', SF_1: 'View/Edit', SF_2: 'View Only', SF_3: 'View Only', supervisor: 'Full', doctor: 'Full', nurse: 'View Only' },
  { name: 'Segments & Audiences', sysadmin: 'Full', admin: 'Full', SF_1: 'View Only', SF_2: 'No', SF_3: 'No', supervisor: 'Full', doctor: 'No', nurse: 'No' },
  { name: 'Tier & Loyalty Rules', sysadmin: 'Full', admin: 'Full', SF_1: 'View Only', SF_2: 'View Only', SF_3: 'No', supervisor: 'Full', doctor: 'No', nurse: 'No' },
  { name: 'Sales Pipeline (Deals)', sysadmin: 'Full', admin: 'Full', SF_1: 'Manage Deals', SF_2: 'View Only', SF_3: 'No', supervisor: 'Full', doctor: 'No', nurse: 'No' },
  { name: 'Omnichannel Inbox', sysadmin: 'Full', admin: 'Full', SF_1: 'My Chats', SF_2: 'Full Inbox', SF_3: 'No', supervisor: 'Full', doctor: 'Consult', nurse: 'Triage' },
  { name: 'Service / Case (Tickets)', sysadmin: 'Full', admin: 'Full', SF_1: 'Create Ticket', SF_2: 'Manage Tickets', SF_3: 'No', supervisor: 'Full', doctor: 'Medical Case', nurse: 'Nursing Case' },
  { name: 'Voice (3CX PBX)', sysadmin: 'Full', admin: 'Full', SF_1: 'Call/Receive', SF_2: 'Call/Receive', SF_3: 'Collection Calls', supervisor: 'Full', doctor: 'No', nurse: 'No' },
  { name: 'Credit Sales & Limits', sysadmin: 'Full', admin: 'Full', SF_1: 'View Badge', SF_2: 'View Badge', SF_3: 'Manage Credit', supervisor: 'View/Approve', doctor: 'No', nurse: 'No' },
  { name: 'User Management (CRUD)', sysadmin: 'Full Access', admin: 'Full Access', SF_1: 'No', SF_2: 'No', SF_3: 'No', supervisor: 'View Only', doctor: 'No', nurse: 'No' },
  { name: 'Connectors & Webhooks', sysadmin: 'Full Config', admin: 'Full Config', SF_1: 'No', SF_2: 'No', SF_3: 'No', supervisor: 'No', doctor: 'No', nurse: 'No' },
];

export const RolePermissionMatrixTab: React.FC = () => (
  <div className="bg-white rounded-card border border-border p-5 shadow-card space-y-4">
    <div className="flex items-center justify-between pb-2 border-b border-divider">
      <h3 className="text-xs font-bold text-text-primary">Role & Permission Matrix</h3>
    </div>

    <div className="border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-bg-muted text-text-secondary border-b border-border">
          <tr>
            <th className="px-4 py-3 font-semibold">โมดูลระบบ / การทำงาน</th>
            <th className="px-3 py-3 font-mono font-bold text-purple-800 text-center">sysadmin</th>
            <th className="px-3 py-3 font-mono font-bold text-blue-800 text-center">admin</th>
            <th className="px-3 py-3 font-mono font-bold text-emerald-800 text-center">SF_1</th>
            <th className="px-3 py-3 font-mono font-bold text-cyan-800 text-center">SF_2</th>
            <th className="px-3 py-3 font-mono font-bold text-amber-800 text-center">SF_3</th>
            <th className="px-3 py-3 font-mono font-bold text-indigo-800 text-center">supervisor</th>
            <th className="px-3 py-3 font-mono font-bold text-teal-800 text-center">doctor</th>
            <th className="px-3 py-3 font-mono font-bold text-rose-800 text-center">nurse</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {MODULES_MATRIX.map((m) => (
            <tr key={m.name} className="hover:bg-bg-subtle">
              <td className="px-4 py-2.5 font-bold text-text-primary">{m.name}</td>
              <td className="px-3 py-2.5 text-center font-medium text-purple-700">{m.sysadmin}</td>
              <td className="px-3 py-2.5 text-center font-medium text-blue-700">{m.admin}</td>
              <td className="px-3 py-2.5 text-center font-medium text-emerald-700">{m.SF_1}</td>
              <td className="px-3 py-2.5 text-center font-medium text-cyan-700">{m.SF_2}</td>
              <td className="px-3 py-2.5 text-center font-medium text-amber-700">{m.SF_3}</td>
              <td className="px-3 py-2.5 text-center font-medium text-indigo-700">{m.supervisor}</td>
              <td className="px-3 py-2.5 text-center font-medium text-teal-700">{m.doctor}</td>
              <td className="px-3 py-2.5 text-center font-medium text-rose-700">{m.nurse}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
