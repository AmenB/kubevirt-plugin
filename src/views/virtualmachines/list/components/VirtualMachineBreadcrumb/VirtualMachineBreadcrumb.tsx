import * as React from 'react';
import { useHistory } from 'react-router-dom';

import { VirtualMachineModelRef } from '@kubevirt-ui/kubevirt-api/console';
import { useActiveNamespacePath } from '@kubevirt-utils/hooks/useActiveNamespacePath';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import { Breadcrumb, BreadcrumbItem, Button } from '@patternfly/react-core';

export const VirtualMachineBreadcrumb: React.FC = React.memo(() => {
  const [namespacePath] = useActiveNamespacePath();

  const { t } = useKubevirtTranslation();
  const history = useHistory();

  return (
    <div>
      <Breadcrumb className="pf-c-breadcrumb co-breadcrumb">
        <BreadcrumbItem>
          <Button
            variant="link"
            isInline
            onClick={() => history.push(`/k8s/${namespacePath}/${VirtualMachineModelRef}`)}
          >
            {t('VirtualMachines')}
          </Button>
        </BreadcrumbItem>
        <BreadcrumbItem>{t('VirtualMachine details')}</BreadcrumbItem>
      </Breadcrumb>
    </div>
  );
});
export default VirtualMachineBreadcrumb;
