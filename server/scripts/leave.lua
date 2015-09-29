local serverRoomsKey = KEYS[1]
local roomCountsKey = KEYS[2]
local roomTimeoutsKey = KEYS[3]

local room = ARGV[1]
local time = tonumber(ARGV[2])

local serverCount = tonumber(redis.call('ZINCRBY', serverRoomsKey, -1, room))
local count = tonumber(redis.call('ZINCRBY', roomCountsKey, -1, room))

if serverCount == 0 then
	redis.call('ZREM', serverRoomsKey, room)
end

redis.call('PUBLISH', 'users', cjson.encode({room=room,count=count}))

if count == 0 then
  redis.call('ZADD', roomTimeoutsKey, time, room)	
end
