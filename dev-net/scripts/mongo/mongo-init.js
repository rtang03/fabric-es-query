
db.auth('root', 'example')

db = db.getSiblingDB('did-db')
// https://docs.mongodb.com/manual/reference/built-in-roles/#std-label-built-in-roles
db.createUser({
  user: 'tester',
  pwd: 'tester-password',
  roles: [
    {
      role: 'dbOwner',
      db: 'did-db',
    },
  ],
})
