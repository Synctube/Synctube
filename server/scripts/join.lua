local serverRoomsKey = KEYS[1]
local roomCountsKey = KEYS[2]
local roomTimeoutsKey = KEYS[3]
local roomExpiredKey = KEYS[4]

local nodesKey = KEYS[5]
local stateKey = KEYS[6]
local lengthKey = KEYS[7]

local room = ARGV[1]
local time = tonumber(ARGV[2])

local timeout = time - (30 * 60)
local expired = redis.call('ZRANGEBYSCORE', roomTimeoutsKey, '-inf', timeout)
redis.call('ZREMRANGEBYSCORE', roomTimeoutsKey, '-inf', timeout)

for _, r in ipairs(expired) do
  redis.call('ZREM', roomCountsKey, r)
  redis.call('SADD', roomExpiredKey, r)
end

if redis.call('SREM', roomExpiredKey, room) == 1 then
  redis.call('DEL', nodesKey, stateKey, lengthKey)
end

redis.call('ZINCRBY', serverRoomsKey, 1, room)
local count = tonumber(redis.call('ZINCRBY', roomCountsKey, 1, room))

redis.call('PUBLISH', 'users', cjson.encode({room=room,count=count}))

redis.call('ZREM', roomTimeoutsKey, room)
