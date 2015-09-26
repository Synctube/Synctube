local serverRoomsKey = KEYS[1]
local roomCountsKey = KEYS[2]
local roomTimeoutsKey = KEYS[3]

local room = ARGV[1]
local time = tonumber(ARGV[2])

redis.call('ZINCRBY', serverRoomsKey, -1, room)
local count = tonumber(redis.call('ZINCRBY', roomCountsKey, -1, room))

if count == 0 then
  redis.call('ZADD', roomTimeoutsKey, time, room)	
end
