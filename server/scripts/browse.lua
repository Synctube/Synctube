local roomCountsKey = KEYS[1]
local roomTimeoutsKey = KEYS[2]
local roomExpiredKey = KEYS[3]

local time = tonumber(ARGV[1])

local timeout = time - (30 * 60)
local expired = redis.call('ZRANGEBYSCORE', roomTimeoutsKey, '-inf', timeout)
redis.call('ZREMRANGEBYSCORE', roomTimeoutsKey, '-inf', timeout)

for _, r in ipairs(expired) do
  redis.call('ZREM', roomCountsKey, r)
  redis.call('SADD', roomExpiredKey, r)
end

local rooms = redis.call('ZREVRANGE', roomCountsKey, 0, 9, 'WITHSCORES')

local result = {}
for idx = 1, #rooms, 2 do
  result[#result + 1] = {name=rooms[idx],count=tonumber(rooms[idx + 1])}
end

if #result > 0 then
  return cjson.encode(result)
else
  return '[]'
end
