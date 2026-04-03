import React, { createContext, useState, useContext } from 'react'
import axios from 'axios'
import { authDataContext } from './authContex'

export const userDataContext = createContext()

function UserProvider({children}) {
    const [userdata, setUserdata] = useState(null)
    const { serverUrl } = useContext(authDataContext)

    const getCurrentUser = async () => {
        try {
            // Note: withCredentials should be the 3rd argument for axios.post when data is the 2nd
            let res = await axios.post(serverUrl + 'api/user/get-user', {}, { withCredentials: true })
            setUserdata(res.data.user)
        } catch (err) {
            console.log(err)
        }
    }

    let value = {
        userdata,
        setUserdata,
        getCurrentUser
    }

  return (
    <userDataContext.Provider value={value}>
        {children}
    </userDataContext.Provider>
  )
}

export default UserProvider