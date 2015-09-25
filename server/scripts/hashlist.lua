--------------------------
-- Redis key parameters --
--------------------------

local _counterKey = KEYS[1]
local _nodesKey = KEYS[2]
local _stateKey = KEYS[3]
local _lengthKey = KEYS[4]
local _eventChannel = ARGV[1]
local _room = ARGV[2]

----------------------------
-- Redis access functions --
----------------------------

local _getNode = function (key)
  local enc = redis.call('HGET', _nodesKey, key)
  if not enc then
    return {h=0,t=0}
  end
  return cmsgpack.unpack(enc)
end

local _setNode = function (key, node)
  local enc = cmsgpack.pack(node)
  redis.call('HSET', _nodesKey, key, enc)
end

local _deleteNode = function (key)
  redis.call('HDEL', _nodesKey, key)
end

local _getNextKey = function ()
  return tonumber(redis.call('INCR', _counterKey))
end

--------------------------------
-- Internal utility functions --
--------------------------------

local _extract = function (key)
  local node = _getNode(key)
  local head = _getNode(node.h)
  head.t = node.t
  _setNode(node.h, head)
  local tail = _getNode(node.t)
  tail.h = node.h
  _setNode(node.t, tail)
  return node.v
end

-------------------
-- API functions --
-------------------

local getValue = function (key)
  local node = _getNode(key)
  return node.v
end

-- Iterates the list.
--
-- If `start` is 0 or nil, iteration begins with the first element
-- If `start` is given, iteration will start at the element with that key (inclusive)
-- If `start` is not a valid key, behavior is undefined (TODO)
--
-- If `stop` is 0 or nil, iteration stops at the end of the list
-- If `stop` is given, iteration will end before the element with that key (exclusive)
-- If `stop` is an element that comes before the start, iteration will silently wrap around to the beginning of the list
-- If `stop` is not a valid key, iteration loops forever

local iterate = function (start, stop)
  local key = start or 0
  stop = stop or 0
  return function ()
    if not key then return end
    if key == 0 then
      key = _getNode(0).h
    end
    if key ~= 0 then
      local cur = key
      local node = _getNode(cur)
      key = node.h
      if key == stop then
        key = nil
      end
      return node.v, cur
    end
  end
end

local getAll = function ()
  local t = {}
  for v, k in iterate() do
    t[#t + 1] = {key=k,value=v}
  end
  return t
end

local getKeys = function ()
  local t = {}
  for _, k in iterate() do
    t[#t + 1] = k
  end
  return t
end

local insert = function (key, value, before)
  local head = _getNode(before)
  local node = {v=value,h=before,t=head.t}
  head.t = key
  _setNode(node.h, head)
  local tail = _getNode(node.t)
  tail.h = key
  _setNode(node.t, tail)
  _setNode(key, node)
end

local delete = function (key)
  _extract(key)
  _deleteNode(key)
end

local move = function (key, before)
  local value = _extract(key)
  insert(key, value, before)
  redis.call('PUBLISH', _eventChannel, cjson.encode({room=_room,event='move',args={key,before}}))
end

local push = function (value)
  local key = _getNextKey()
  insert(key, value, 0)
  return key
end

---------------------------------
-- Playlist handling functions --
---------------------------------

local getState = function ()
  local enc = redis.call('GET', _stateKey)
  if enc then
    return cmsgpack.unpack(enc)
  else
    return {
      time = 0,
      key = nil,
      playing = false,
      offset = 0
    }
  end
end

local formatState = function (state)
  local f = {}
  if state.key ~= 0 then
    f.key = state.key
  else
    f.key = nil
  end
  f.playing = state.playing
  f.offset = state.offset
  return f
end

local setState = function (state, notify)
  redis.call('SET', _stateKey, cmsgpack.pack(state))
  if notify then
    redis.call('PUBLISH', _eventChannel, cjson.encode({room=_room,event='state',args={formatState(state)}}))
  end
end

local getLength = function ()
  return tonumber(redis.call('GET', _lengthKey)) or 0
end

local addLength = function (length)
  redis.call('INCRBYFLOAT', _lengthKey, length)
end

local updateState = function (time)

  local state = getState()

  if time < state.time then
    -- TODO: Error, or just let it go?
    -- Maybe write a warning to a logging queue?
    time = state.time
  end

  local elapsed = time - state.time
  state.time = time

  if not state.playing then
    return state
  end

  elapsed = (elapsed + state.offset) % getLength()
  for v, k in iterate(state.key, state.key) do
    if elapsed < v.length then
      state.offset = elapsed
      state.key = k
      return state
    else
      elapsed = elapsed - v.length
    end
  end

  state.key = nil
  state.playing = false
  state.offset = 0

  return state -- TODO: Maybe warn on this condition?

end

local play = function (time, key)
  setState({
    time = time,
    key = key,
    playing = true,
    offset = 0
  }, true)
end

local setPlaying = function (time, playing)
  local state = updateState(time)
  if playing and (state.key == nil) then
    state.key = _getNode(0).h
    if state.key == nil then
      setState(state)
      return false 
    end
  end
  state.playing = playing
  setState(state, true)
  return true
end

local setOffset = function (time, offset)
  local state = updateState(time)
  state.offset = offset
  setState(state, true)
end

local _knuthShuffle = function (t)
  local n = #t
  while n > 1 do
    local k = math.random(n)
    t[n], t[k] = t[k], t[n]
    n = n - 1
  end
  return t
end

local shuffle = function (time, seed)
  local state = updateState(time)
  math.randomseed(seed)
  for _, k in ipairs(_knuthShuffle(getKeys())) do
    move(k, 0)
  end
  setState(state, true)
end

local addVideo = function (time, video)
  local state = updateState(time)
  addLength(video.length)
  local key = push(video)
  redis.call('PUBLISH', _eventChannel, cjson.encode({room=_room,event='put',args={key,video}}))
  setState(state, true)
end

local delVideo = function (time, key)
  local state = updateState(time)
  local video = getValue(key)
  addLength(-video.length)
  delete(key)
  redis.call('PUBLISH', _eventChannel, cjson.encode({room=_room,event='remove',args={key}}))
  if state.key == key then
    state.playing = false
    state.key = nil
    state.offset = 0
  end
  setState(state, true)
end

local moveVideo = function (time, key, before)
  local state = updateState(time)
  move(key, before)
  setState(state, true)
end

-------------------------------
-- Room expiration functions --
-------------------------------

local deleteRoom = function ()
  redis.call('DEL', _nodesKey)
  redis.call('DEL', _stateKey)
  redis.call('DEL', _lengthKey)
end

--------------------
-- Function calls --
--------------------

local call = ARGV[3]
local time = tonumber(ARGV[4])
local arg1 = ARGV[5]
local arg2 = ARGV[6]

if call == "add" then
  addVideo(time, cjson.decode(arg1))
elseif call == "del" then
  delVideo(time, tonumber(arg1))
elseif call == "move" then
  moveVideo(time, tonumber(arg1), tonumber(arg2))
elseif call == "play" then
  play(time, tonumber(arg1))
elseif call == "shuffle" then
  shuffle(time, time * 1000)
elseif call == "setPlaying" then
  setPlaying(time, tonumber(arg1) ~= 0)
elseif call == "setOffset" then
  setOffset(time, tonumber(arg1))
elseif call == "list" then
  local list = getAll()
  if #list == 0 then return "[]" end
  return cjson.encode(list)
elseif call == "state" then
  local state = updateState(time)
  setState(state)
  return cjson.encode(formatState(state))
elseif call == "deleteRoom" then
  deleteRoom()
else
  return "Unrecognized command: " .. call
end

-- TODO:
-- Argument checking
-- Error handling
-- Publish events
