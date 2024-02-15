const reducer = (state,action)=>{
    
    switch (action.type) {
      case "UPDATE_LOCATION":
        return { ...state, location: action.payload };

      default:
        throw new Error("No matched action!");
    }
}

export default reducer;