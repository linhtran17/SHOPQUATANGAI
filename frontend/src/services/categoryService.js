import api from "./api";
export const categoryApi = {
    async tree(params = {}){
        const{data} = await api.get('/categories/tree',{params});
        return data;
    }
}