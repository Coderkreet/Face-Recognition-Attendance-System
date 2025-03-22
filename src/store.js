import {createStore} from 'redux'

const reducer =(state=0,action)=>{
    console.log(action)

    switch (action.type){
        case 'INCREMENT':
            return state+1

        case 'DECREMENT':
            return state-1

        default:
            return state;
    }
}
export const myStore=createStore(reducer);