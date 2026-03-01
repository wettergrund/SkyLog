import styles from './ErrorMessage.module.css';

interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  return <div className={styles.error} role="alert">{message}</div>;
}
