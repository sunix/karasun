import { useRouter } from 'expo-router';

import { DevicePickerModal } from '@/components/DevicePickerModal';

export default function DevicesScreen() {
  const router = useRouter();
  return <DevicePickerModal onSelected={() => router.back()} />;
}
