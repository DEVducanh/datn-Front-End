import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import gsap from 'gsap'
import { CircleX } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function ModalInfor({ open, hanldeClose }) {
  const [username, setName] = useState('')
  const [phone, setPhone] = useState('')
  const cardRef = useRef(null)

  const handleSubmit = async () => {
    const guestToken = localStorage.getItem('access_token')

    if (!guestToken) {
      console.error('Không tìm thấy guest token')
      return
    }
    try {
      const res = await fetch(
        'https://api-datn-orderfood-backend-2.onrender.com/auth/guest/update',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${guestToken}`,
          },
          body: JSON.stringify({ username, phone }),
        }
      )
      hanldeClose()
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (open) {
      gsap.fromTo(
        cardRef.current,
        { y: -200, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [open])

  const closeWithAnim = () => {
    gsap.to(cardRef.current, {
      y: -200,
      opacity: 0,
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => {
        hanldeClose() // chỉ đóng sau khi animation xong
      },
    })
  }

  if (!open) return null

  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 bg-black/20 flex items-center justify-center z-50">
      <Card ref={cardRef} className="w-[500px] min-h-[400px] max-w-sm relative">
        <Button
          variant={'outline'}
          className={'w-[30px] h-[30px] absolute top-2 right-2'}
          onClick={closeWithAnim}
        >
          <CircleX color="#000000" strokeWidth={1.75} />
        </Button>
        <CardHeader>
          <CardTitle>Thông Tin</CardTitle>
          <CardDescription>Nhập Tên và Số Điện thoại của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Họ Tên</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nguyen Van A"
                  value={username}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="phone">Số Điện Thoại</Label>
                </div>
                <Input
                  id="phone"
                  type="text"
                  placeholder="0123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button className="w-full bg-amber-500" type="submit" onClick={handleSubmit}>
            Gửi
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
