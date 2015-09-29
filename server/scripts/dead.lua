local serverRoomsKey = KEYS[1]
local roomCountsKey = KEYS[2]
local roomTimeoutsKey = KEYS[3]
local serversKey = KEYS[4]

local time = tonumber(ARGV[1])
local dead = ARGV[2]

redis.call('ZUNIONSTORE', roomCountsKey, 2, roomCountsKey, serverRoomsKey, 'WEIGHTS', 1, -1)

redis.call('ZINTERSTORE', serverRoomsKey, 2, roomCountsKey, serverRoomsKey, 'WEIGHTS', 1, 0)
local changed = redis.call('ZRANGE', serverRoomsKey, 0, -1, 'WITHSCORES')

for idx = 1, #changed, 2 do
  local room = changed[idx]
  local count = changed[idx + 1]
  redis.call('PUBLISH', 'users', cjson.encode({room=room,count=tonumber(count)}))
end

redis.call('DEL', serverRoomsKey)
redis.call('ZREM', serversKey, dead)

local empty = redis.call('ZRANGEBYSCORE', roomCountsKey, '-inf', 0)

for _, room in ipairs(empty) do
  redis.call('ZADD', roomTimeoutsKey, time, room)
end
