local roomExpiredKey = KEYS[1]

local nodesKey = KEYS[2]
local stateKey = KEYS[3]
local lengthKey = KEYS[4]

local room = ARGV[1]

if redis.call('SREM', roomExpiredKey, room) == 1 then
  redis.call('DEL', nodesKey, stateKey, lengthKey)
end
