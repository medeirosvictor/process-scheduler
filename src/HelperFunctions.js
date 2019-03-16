export function sortList(arr, key) {
    let getKey = prop(key)

    return arr.sort(function(a, b){
        let x = getKey(a)
        let y = getKey(b)
        return ((x < y) ? -1 : ((x > y) ? 1 : 0))
    })
}

function prop(key) {
    var keys = key.split('.')

    return keys.reduce.bind(keys, function(obj, name) {
        return obj[name]
    })
}