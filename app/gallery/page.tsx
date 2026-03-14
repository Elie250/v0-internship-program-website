import Image from 'next/image'

export default function Gallery() {

  const images = [
    '/uploads/plc.jpg',
    '/uploads/arduino.jpg',
    '/uploads/workshop.jpg'
  ]

  return (
    <div className="p-10 grid grid-cols-3 gap-6">

      {images.map((img, i) => (
        <Image
          key={i}
          src={img}
          alt="Engineering Hub"
          width={400}
          height={300}
        />
      ))}

    </div>
  )
}