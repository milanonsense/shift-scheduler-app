import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext() //holds authenticated data

export function AuthProvider({ children }) { //give all pages access to user info
  const [user, setUser] = useState(null) //stores logged in user null means no user is currently logged in

  return ( //makes user and set user avaliable for use
    <AuthContext.Provider value={{ user, setUser }}> 
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

//helps to get the info from user using useAuth simply