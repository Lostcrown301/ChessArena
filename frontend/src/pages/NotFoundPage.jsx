import { Link } from 'react-router-dom';
import { ErrorState } from '@components/common/ErrorState';
import { PageContainer } from '@components/common/PageContainer';
import { Button } from '@components/ui/Button';

export function NotFoundPage() {
  return (
    <PageContainer className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-xl">
        <ErrorState message="The page you requested does not exist." title="Page not found" />
        <div className="mt-6 text-center">
          <Button as={Link} to="/">
            Return home
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
