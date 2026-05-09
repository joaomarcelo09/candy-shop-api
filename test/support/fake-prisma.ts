import { SessionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
};

type Candy = {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
};

type Session = {
  id: string;
  totalSold: number;
  date: Date;
  status: SessionStatus;
  createdAt: Date;
};

type SessionCandy = {
  id: string;
  sessionId: string;
  candyId: string;
  quantitySold: number;
};

type SessionOrder = {
  id: string;
  sessionId: string;
  createdAt: Date;
  registeredByUserId: string | null;
};

type OrderCandy = {
  id: string;
  sessionOrderId: string;
  candyId: string;
  quantity: number;
  unitPriceSnapshot: number;
};

export class FakePrismaService {
  users: User[] = [];
  candies: Candy[] = [];
  sessions: Session[] = [];
  sessionCandiesRecords: SessionCandy[] = [];
  sessionOrdersRecords: SessionOrder[] = [];
  orderCandiesRecords: OrderCandy[] = [];

  $transaction = jest.fn(async (callback: (tx: this) => Promise<unknown>) => callback(this));

  user = {
    findUnique: jest.fn(({ where }: { where: { email?: string; id?: string } }) => {
      if (where.email) {
        return this.users.find((user) => user.email === where.email) ?? null;
      }

      if (where.id) {
        return this.users.find((user) => user.id === where.id) ?? null;
      }

      return null;
    }),
    create: jest.fn(({ data }: { data: Omit<User, 'id' | 'createdAt'> }) => {
      const user: User = { id: randomUUID(), createdAt: new Date(), ...data };
      this.users.push(user);
      return user;
    }),
    findMany: jest.fn(({ select }: { select?: Record<string, boolean> } = {}) => {
      if (!select) {
        return [...this.users];
      }

      return this.users.map((user) => ({
        id: select.id ? user.id : undefined,
        name: select.name ? user.name : undefined,
        email: select.email ? user.email : undefined,
        createdAt: select.createdAt ? user.createdAt : undefined,
      }));
    }),
  };

  candy = {
    findUnique: jest.fn(({ where }: { where: { id?: string; name?: string } }) => {
      if (where.id) {
        return this.candies.find((candy) => candy.id === where.id) ?? null;
      }

      if (where.name) {
        return this.candies.find((candy) => candy.name === where.name) ?? null;
      }

      return null;
    }),
    findMany: jest.fn(() => [...this.candies]),
    create: jest.fn(({ data }: { data: Omit<Candy, 'id' | 'createdAt'> }) => {
      const candy: Candy = { id: randomUUID(), createdAt: new Date(), ...data };
      this.candies.push(candy);
      return candy;
    }),
    update: jest.fn(({ where, data }: { where: { id: string }; data: Partial<Candy> }) => {
      const candy = this.candies.find((item) => item.id === where.id);
      if (!candy) {
        return null;
      }

      Object.assign(candy, data);
      return candy;
    }),
    delete: jest.fn(({ where }: { where: { id: string } }) => {
      this.candies = this.candies.filter((item) => item.id !== where.id);
      return null;
    }),
  };

  session = {
    findFirst: jest.fn(({ where }: { where?: { status?: SessionStatus } } = {}) => {
      const records = where?.status
        ? this.sessions.filter((session) => session.status === where.status)
        : this.sessions;
      return records[0] ?? null;
    }),
    findUnique: jest.fn(({ where }: { where: { id: string } }) => {
      return this.sessions.find((session) => session.id === where.id) ?? null;
    }),
    findMany: jest.fn(({ where }: { where?: { status?: SessionStatus } } = {}) => {
      return where?.status
        ? this.sessions.filter((session) => session.status === where.status)
        : [...this.sessions];
    }),
    create: jest.fn(
      ({ data, select }: { data: Partial<Session>; select?: Record<string, boolean> }) => {
        const session: Session = {
          id: randomUUID(),
          totalSold: data.totalSold ?? 0,
          date: data.date ?? new Date(),
          status: data.status ?? SessionStatus.OPEN,
          createdAt: new Date(),
        };
        this.sessions.push(session);

        if (!select) {
          return session;
        }

        return {
          id: select.id ? session.id : undefined,
          status: select.status ? session.status : undefined,
          totalSold: select.totalSold ? session.totalSold : undefined,
          date: select.date ? session.date : undefined,
          createdAt: select.createdAt ? session.createdAt : undefined,
        };
      },
    ),
    update: jest.fn(({ where, data }: { where: { id: string }; data: Partial<Session> }) => {
      const session = this.sessions.find((item) => item.id === where.id);
      if (!session) {
        return null;
      }

      Object.assign(session, data);
      return session;
    }),
  };

  sessionCandy = {
    findUnique: jest.fn(
      ({
        where,
      }: {
        where: { sessionId_candyId?: { sessionId: string; candyId: string }; id?: string };
      }) => {
        if (where.id) {
          return this.sessionCandiesRecords.find((item) => item.id === where.id) ?? null;
        }

        if (where.sessionId_candyId) {
          const { sessionId, candyId } = where.sessionId_candyId;
          return (
            this.sessionCandiesRecords.find(
              (item) => item.sessionId === sessionId && item.candyId === candyId,
            ) ?? null
          );
        }

        return null;
      },
    ),
    findMany: jest.fn(
      ({ where, include }: { where?: { sessionId?: string }; include?: { candy?: boolean } } = {}) => {
        const records = where?.sessionId
          ? this.sessionCandiesRecords.filter((item) => item.sessionId === where.sessionId)
          : this.sessionCandiesRecords;

        if (!include?.candy) {
          return [...records];
        }

        return records.map((record) => ({
          ...record,
          candy: this.candies.find((item) => item.id === record.candyId)!,
        }));
      },
    ),
    create: jest.fn(({ data }: { data: Omit<SessionCandy, 'id'> }) => {
      const record: SessionCandy = { id: randomUUID(), ...data };
      this.sessionCandiesRecords.push(record);
      return record;
    }),
    update: jest.fn(({ where, data }: { where: { id: string }; data: Partial<SessionCandy> }) => {
      const record = this.sessionCandiesRecords.find((item) => item.id === where.id);
      if (!record) {
        return null;
      }

      Object.assign(record, data);
      return record;
    }),
    count: jest.fn(({ where }: { where?: { candyId?: string } } = {}) => {
      if (where?.candyId) {
        return this.sessionCandiesRecords.filter((item) => item.candyId === where.candyId).length;
      }

      return this.sessionCandiesRecords.length;
    }),
  };

  sessionOrder = {
    create: jest.fn(({ data }: { data: { sessionId: string; registeredByUserId?: string | null } }) => {
      const order: SessionOrder = {
        id: randomUUID(),
        sessionId: data.sessionId,
        createdAt: new Date(),
        registeredByUserId: data.registeredByUserId ?? null,
      };
      this.sessionOrdersRecords.push(order);
      return order;
    }),
    findUnique: jest.fn(
      ({
        where,
        include,
      }: {
        where: { id: string };
        include?: { items?: { include?: { candy?: boolean }; orderBy?: { candy?: { name: 'asc' | 'desc' } } } };
      }) => {
        const order = this.sessionOrdersRecords.find((item) => item.id === where.id) ?? null;

        if (!order) {
          return null;
        }

        if (!include?.items) {
          return order;
        }

        const includeItems = include.items;

        return {
          ...order,
          items: this.getOrderItems(order.id, includeItems.include?.candy ?? false),
        };
      },
    ),
    findMany: jest.fn(
      ({
        where,
        include,
        orderBy,
      }: {
        where?: { sessionId?: string };
        include?: { items?: { include?: { candy?: boolean }; orderBy?: { candy?: { name: 'asc' | 'desc' } } } };
        orderBy?: { createdAt?: 'asc' | 'desc' };
      } = {}) => {
        const records = where?.sessionId
          ? this.sessionOrdersRecords.filter((item) => item.sessionId === where.sessionId)
          : [...this.sessionOrdersRecords];

        records.sort((left, right) =>
          (orderBy?.createdAt ?? 'asc') === 'desc'
            ? right.createdAt.getTime() - left.createdAt.getTime()
            : left.createdAt.getTime() - right.createdAt.getTime(),
        );

        if (!include?.items) {
          return records;
        }

        const includeItems = include.items;

        return records.map((order) => ({
          ...order,
          items: this.getOrderItems(order.id, includeItems.include?.candy ?? false),
        }));
      },
    ),
    delete: jest.fn(({ where }: { where: { id: string } }) => {
      const deletedOrder =
        this.sessionOrdersRecords.find((item) => item.id === where.id) ?? null;
      this.sessionOrdersRecords = this.sessionOrdersRecords.filter((item) => item.id !== where.id);
      return deletedOrder;
    }),
  };

  orderCandy = {
    create: jest.fn(({ data }: { data: Omit<OrderCandy, 'id'> }) => {
      const record: OrderCandy = { id: randomUUID(), ...data };
      this.orderCandiesRecords.push(record);
      return record;
    }),
    findMany: jest.fn(
      ({
        where,
        include,
        orderBy,
      }: {
        where?: { candyId?: string; sessionOrderId?: string; sessionOrder?: { sessionId: string } };
        include?: { candy?: boolean };
        orderBy?:
          | Array<{ candy?: { name: 'asc' | 'desc' }; unitPriceSnapshot?: 'asc' | 'desc' }>
          | { unitPriceSnapshot?: 'asc' | 'desc' };
      } = {}) => {
        let records = [...this.orderCandiesRecords];

        if (where?.candyId) {
          records = records.filter((item) => item.candyId === where.candyId);
        }

        if (where?.sessionOrderId) {
          records = records.filter((item) => item.sessionOrderId === where.sessionOrderId);
        }

        if (where?.sessionOrder?.sessionId) {
          records = records.filter((item) => {
            const order = this.sessionOrdersRecords.find(
              (sessionOrder) => sessionOrder.id === item.sessionOrderId,
            );
            return order?.sessionId === where.sessionOrder?.sessionId;
          });
        }

        records.sort((left, right) => {
          const leftCandy = this.candies.find((item) => item.id === left.candyId)!;
          const rightCandy = this.candies.find((item) => item.id === right.candyId)!;

          if (leftCandy.name !== rightCandy.name) {
            return leftCandy.name.localeCompare(rightCandy.name);
          }

          return left.unitPriceSnapshot - right.unitPriceSnapshot;
        });

        if (!include?.candy) {
          return records;
        }

        return records.map((record) => ({
          ...record,
          candy: this.candies.find((item) => item.id === record.candyId)!,
        }));
      },
    ),
    deleteMany: jest.fn(({ where }: { where?: { sessionOrderId?: string } } = {}) => {
      const before = this.orderCandiesRecords.length;

      if (where?.sessionOrderId) {
        this.orderCandiesRecords = this.orderCandiesRecords.filter(
          (item) => item.sessionOrderId !== where.sessionOrderId,
        );
      } else {
        this.orderCandiesRecords = [];
      }

      return { count: before - this.orderCandiesRecords.length };
    }),
    count: jest.fn(({ where }: { where?: { candyId?: string } } = {}) => {
      if (where?.candyId) {
        return this.orderCandiesRecords.filter((item) => item.candyId === where.candyId).length;
      }

      return this.orderCandiesRecords.length;
    }),
  };

  private getOrderItems(orderId: string, includeCandy: boolean) {
    const items = this.orderCandiesRecords
      .filter((item) => item.sessionOrderId === orderId)
      .sort((left, right) => {
        const leftCandy = this.candies.find((item) => item.id === left.candyId)!;
        const rightCandy = this.candies.find((item) => item.id === right.candyId)!;
        return leftCandy.name.localeCompare(rightCandy.name);
      });

    if (!includeCandy) {
      return items;
    }

    return items.map((item) => ({
      ...item,
      candy: this.candies.find((candy) => candy.id === item.candyId)!,
    }));
  }
}
