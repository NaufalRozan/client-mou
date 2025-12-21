import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { userLogin } from "./authActions";

type UserState = {
  id?: string;
  name?: string;
  email?: string;
  token?: string;
  [key: string]: any;
};

interface AuthState {
  userInfo?: UserState;
  loading?: boolean;
  success?: string | null;
  error?: string | null;
}

const initialState: Partial<AuthState> = {}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateUser: (state, action: PayloadAction<UserState>) => {
      state.userInfo = action.payload
    },
    resetUser: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(userLogin.pending, (state) => {
        state.loading = true;
        state.success = null;
        state.error = null;
      })
      .addCase(userLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Logged in successfully';
        state.userInfo = action.payload;
      })
      .addCase(userLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
  }
});

export const { updateUser, resetUser } = authSlice.actions;
export default authSlice.reducer;