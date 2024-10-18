import React from 'react'
import {BeatLoader} from 'react-spinners'

function Loader() {
  return (
    <div className="fixed z-10 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
       <BeatLoader color="#144ed1" size={20} />
    </div>
  )
}

export default Loader