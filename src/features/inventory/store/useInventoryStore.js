import { create } from "zustand";
import {
    getInventory,
    registerInventory,
    deleteInventory,
} from "../../../shared/api";

export const useInventoryStore = create((set, get) => ({
    fields: [],
    loading: false,
    error: null,

    getInventory: async () => {
        try {
            set({ loading: true, error: null });
            const response = await getInventory();
            console.log(response)

            set({
                fields: response.data.data,
                loading: false
            })
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error al obtener ",
                loading: false
            })
        }
    },

    createField: async (formData) => {
        try {
            set({ loading: true, error: null})

            const response = await registerInventory(formData)

            set({
                fields: [response.data.data, ...get().fields],
                loading: false
            })
        } catch (error) {
            set({
                loading: false,
                error: error.response?.data?.message || "Error al crear campo."
            })
        }
    },

    deleteInventory: async (id) => {
        try {
            set({ loading: true, error: null })

            await deleteInventory(id)

            set({
                fields: get().fields.filter(field => field._id !== id),
                loading: false
            })
        } catch (error) {
            set({
                loading: false,
                error: error.response?.data?.message || "Error al eliminar elemento."
            })
        }
    },

   
}))