local counterKey = KEYS[1]
local serversKey = KEYS[2]

local time = tonumber(ARGV[1])
local id = tonumber(ARGV[2])

if not id then
  id = redis.call('INCR', counterKey)
end

redis.call('ZADD', serversKey, time, id)

local timeout = time - 60
local dead = redis.call('ZRANGEBYSCORE', serversKey, '-inf', timeout, 'LIMIT', 0, 5)

local ret = {id=id}

if #dead > 0 then
  ret.dead = dead
end

return cjson.encode(ret)
